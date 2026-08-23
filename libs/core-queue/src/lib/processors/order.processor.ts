import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderCreatedEvent, OrderStatusChangedEvent, DeliveryCompletedEvent } from '@afri-market/marketplace-application';
import { CountrySmsRouterService } from '@afri-market/integrations';
import { EmailService } from '@afri-market/integrations';

@Processor('orders')
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);
  private smsRouter?: CountrySmsRouterService;
  private emailService?: EmailService;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly moduleRef: ModuleRef,
  ) {
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

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing order job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'order-created':
          await this.handleOrderCreated(job.data as OrderCreatedEvent);
          break;
        case 'order-status-changed':
          await this.handleOrderStatusChanged(job.data as OrderStatusChangedEvent);
          break;
        case 'delivery-completed':
          await this.handleDeliveryCompleted(job.data as DeliveryCompletedEvent);
          break;
      }
      this.logger.debug(`Order job ${job.id} completed`);
    } catch (error) {
      this.logger.error(`Order job ${job.id} failed: ${error}`);
      throw error;
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.logger.debug(`Handling order created: ${event.orderId}`);

    // Send OTP SMS to customer
    if (event.customerPhone) {
      await this.sendSms(event.customerPhone, `Your delivery OTP for order ${event.orderId} is: ${event.otpCode}`);
    }

    // Send order confirmation email
    if (event.customerEmail) {
      await this.sendEmail(event.customerEmail, 'Order Confirmed', `Your order ${event.orderId} has been placed. Total: ${event.currency} ${event.total}`);
    }

    // Look up vendor phone and send notification
    if (event.vendorId) {
      const vendorUser = await this.ds.query(
        `SELECT u.phone_number AS "phoneNumber" FROM users u
         JOIN vendors v ON v.user_id = u.id
         WHERE v.id = $1`,
        [event.vendorId],
      );
      const vendorPhone = vendorUser?.[0]?.phoneNumber as string | undefined;
      if (vendorPhone) {
        await this.sendSms(vendorPhone, `New order ${event.orderId} received! Total: ${event.currency} ${event.total}. Please confirm.`);
      }
    }
  }

  private async handleOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    this.logger.debug(`Handling order status changed: ${event.orderId} ${event.oldStatus} -> ${event.newStatus}`);

    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Your order has been confirmed and is being prepared.',
      PREPARING: 'Your order is being prepared.',
      READY_FOR_PICKUP: 'Your order is ready for pickup.',
      OUT_FOR_DELIVERY: 'Your order is on its way!',
      DELIVERED: 'Your order has been delivered. Thank you!',
      CANCELLED: 'Your order has been cancelled.',
    };

    const message = statusMessages[event.newStatus];
    if (message && event.customerPhone) {
      await this.sendSms(event.customerPhone, `${message} Order: ${event.orderId}`);
    }
  }

  private async handleDeliveryCompleted(event: DeliveryCompletedEvent): Promise<void> {
    this.logger.debug(`Handling delivery completed: ${event.deliveryId}`);

    // Notify customer
    if (event.customerPhone) {
      await this.sendSms(event.customerPhone, `Your order ${event.orderId} has been delivered. Thank you for shopping with afriMarket!`);
    }

    // Notify vendor of payment
    if (event.vendorPhone) {
      await this.sendSms(event.vendorPhone, `Payment of ${event.currency} ${event.vendorNet} has been credited to your wallet for order ${event.orderId}`);
    }

    // Notify driver
    if (event.driverPhone) {
      await this.sendSms(event.driverPhone, `Delivery ${event.deliveryId} completed. Earnings: ${event.currency} ${event.driverNet}`);
    }
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    try {
      await this.getSmsRouter().send({ to: phone, message });
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error}`);
    }
  }

  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      await this.getEmailService().send({ to, subject, html: body });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }
}
