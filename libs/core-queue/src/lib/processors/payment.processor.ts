import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Processor('payments')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing payment job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'payment-confirmed':
          await this.handlePaymentConfirmed(job.data);
          break;
        case 'process-payment':
          await this.handleProcessPayment(job.data);
          break;
      }
      this.logger.debug(`Payment job ${job.id} completed`);
    } catch (error) {
      this.logger.error(`Payment job ${job.id} failed: ${error}`);
      throw error;
    }
  }

  private async handlePaymentConfirmed(event: {
    paymentId: string;
    orderId: string;
    tenantId: string;
    vendorId: string;
    amount: number;
    currency: string;
    receiptNumber?: string;
  }): Promise<void> {
    this.logger.debug(`Handling payment confirmed: ${event.paymentId}`);

    // Look up vendor phone and send payment notification
    if (event.vendorId) {
      const vendorUser = await this.ds.query(
        `SELECT u.phone_number AS "phoneNumber" FROM users u
         JOIN vendors v ON v.user_id = u.id
         WHERE v.id = $1`,
        [event.vendorId],
      );
      const vendorPhone = vendorUser?.[0]?.phoneNumber as string | undefined;
      if (vendorPhone) {
        await this.sendSms(vendorPhone, `Payment of ${event.currency} ${event.amount} confirmed for order ${event.orderId}. Funds held in escrow.`);
      }
    }
  }

  private async handleProcessPayment(event: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Processing payment: ${event.paymentId}`);
    // Additional payment processing logic can be added here
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    try {
      // TODO: Integrate with actual SMS provider
      this.logger.debug(`SMS to ${phone}: ${message}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error}`);
    }
  }
}
