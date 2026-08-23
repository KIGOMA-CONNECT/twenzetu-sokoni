import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Job } from 'bullmq';
import { NotificationJobData } from '../queue.service';
import { CountrySmsRouterService } from '@afri-market/integrations';
import { EmailService } from '@afri-market/integrations';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private smsRouter?: CountrySmsRouterService;
  private emailService?: EmailService;

  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  private getSmsRouter(): CountrySmsRouterService {
    if (!this.smsRouter) this.smsRouter = this.moduleRef.get(CountrySmsRouterService, { strict: false });
    return this.smsRouter;
  }

  private getEmailService(): EmailService {
    if (!this.emailService) this.emailService = this.moduleRef.get(EmailService, { strict: false });
    return this.emailService;
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.debug(`Processing notification job ${job.id}: ${job.data.type} to user ${job.data.userId}`);

    try {
      switch (job.data.type) {
        case 'sms':
          await this.sendSMS(job.data);
          break;
        case 'push':
          await this.sendPush(job.data);
          break;
        case 'email':
          await this.sendEmail(job.data);
          break;
        case 'in_app':
          await this.sendInApp(job.data);
          break;
      }

      this.logger.debug(`Notification job ${job.id} completed`);
    } catch (error) {
      this.logger.error(`Notification job ${job.id} failed: ${error}`);
      throw error;
    }
  }

  private async sendSMS(data: NotificationJobData): Promise<void> {
    try {
      const phone = (data.payload as Record<string, unknown>)?.['phoneNumber'] as string | undefined;
      if (!phone) { this.logger.warn(`No phone number for user ${data.userId}, skipping SMS`); return; }
      await this.getSmsRouter().send({ to: phone, message: data.template, tenantId: data.tenantId });
    } catch (error) {
      this.logger.error(`SMS send failed for user ${data.userId}: ${error}`);
    }
  }

  private async sendPush(data: NotificationJobData): Promise<void> {
    this.logger.log(`Push notification queued for user ${data.userId}: ${data.template}`);
  }

  private async sendEmail(data: NotificationJobData): Promise<void> {
    try {
      const email = (data.payload as Record<string, unknown>)?.['email'] as string | undefined;
      if (!email) { this.logger.warn(`No email for user ${data.userId}, skipping email`); return; }
      await this.getEmailService().send({ to: email, subject: 'afriMarket Notification', html: data.template, tenantId: data.tenantId });
    } catch (error) {
      this.logger.error(`Email send failed for user ${data.userId}: ${error}`);
    }
  }

  private async sendInApp(data: NotificationJobData): Promise<void> {
    this.logger.log(`In-app notification for user ${data.userId}: ${data.template}`);
  }
}
