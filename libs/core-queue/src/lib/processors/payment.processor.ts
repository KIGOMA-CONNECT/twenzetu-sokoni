import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const COMMISSION_RATE = 0.10;

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

    // Deduct 10% commission from vendor payout
    const vendorCommission = Math.round(event.amount * COMMISSION_RATE * 100) / 100;
    const vendorNet = event.amount - vendorCommission;

    // Log vendor commission
    await this.ds.query(
      `INSERT INTO commission_logs (tenant_id, order_id, payer_type, payer_id, order_amount, commission_rate, commission_amount, status, deducted_at, created_at)
       VALUES ($1, $2, 'vendor', $3, $4, $5, $6, 'deducted', NOW(), NOW())`,
      [event.tenantId, event.orderId, event.vendorId, event.amount, COMMISSION_RATE, vendorCommission],
    );

    // Update vendor wallet: credit net amount
    await this.ds.query(
      `UPDATE wallets SET balance = balance + $1, updated_at = NOW()
       WHERE owner_id = $2 AND owner_type = 'vendor' AND currency = $3`,
      [vendorNet, event.vendorId, event.currency],
    );

    this.logger.log(`Vendor commission: ${vendorCommission} (${COMMISSION_RATE * 100}%) | Net: ${vendorNet}`);

    // Deduct 10% commission from driver earnings (if delivery fee exists)
    const orderResult = await this.ds.query(
      `SELECT driver_id AS "driverId", delivery_fee AS "deliveryFee" FROM orders WHERE id = $1`,
      [event.orderId],
    );
    const order = orderResult?.[0];

    if (order?.driverId && order.deliveryFee > 0) {
      const driverCommission = Math.round(order.deliveryFee * COMMISSION_RATE * 100) / 100;
      const driverNet = order.deliveryFee - driverCommission;

      // Log driver commission
      await this.ds.query(
        `INSERT INTO commission_logs (tenant_id, order_id, payer_type, payer_id, order_amount, commission_rate, commission_amount, status, deducted_at, created_at)
         VALUES ($1, $2, 'driver', $3, $4, $5, $6, 'deducted', NOW(), NOW())`,
        [event.tenantId, event.orderId, order.driverId, order.deliveryFee, COMMISSION_RATE, driverCommission],
      );

      // Update driver wallet: credit net amount
      await this.ds.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW()
         WHERE owner_id = $2 AND owner_type = 'driver' AND currency = $3`,
        [driverNet, order.driverId, event.currency],
      );

      this.logger.log(`Driver commission: ${driverCommission} (${COMMISSION_RATE * 100}%) | Net: ${driverNet}`);
    }

    // Send vendor SMS notification
    if (event.vendorId) {
      const vendorUser = await this.ds.query(
        `SELECT u.phone_number AS "phoneNumber" FROM users u
         JOIN vendors v ON v.user_id = u.id
         WHERE v.id = $1`,
        [event.vendorId],
      );
      const vendorPhone = vendorUser?.[0]?.phoneNumber as string | undefined;
      if (vendorPhone) {
        await this.sendSms(vendorPhone, `Malipo ya ${event.currency} ${event.amount} yamethibitishwa. Kamisheni: ${vendorCommission}, Pesa neti: ${vendorNet}. Imewekwa kwenye escrow.`);
      }
    }
  }

  private async handleProcessPayment(event: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Processing payment: ${event.paymentId}`);
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    try {
      this.logger.debug(`SMS to ${phone}: ${message}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error}`);
    }
  }
}
