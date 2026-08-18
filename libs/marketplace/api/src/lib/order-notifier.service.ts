import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ISmsService } from '@afri-market/integrations';
import { SMS_SERVICE } from '@afri-market/marketplace-application';
import { NotificationRouterService } from './notification-router.service';

/**
 * Fires out-of-band notifications (SMS + in-app bell) around order events.
 * Never throws: notification failures must not break the order flow.
 */
@Injectable()
export class OrderNotifierService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(SMS_SERVICE) private readonly smsService: ISmsService,
    private readonly router: NotificationRouterService,
  ) {}

  public async notifyCustomerStatusChanged(params: {
    tenantId: string;
    orderId: string;
    newStatus: string;
  }): Promise<void> {
    try {
      const rows = await this.ds.query(
        `SELECT o.customer_id AS "customerId", u.phone_number AS "phoneNumber"
         FROM orders o JOIN users u ON u.id = o.customer_id
         WHERE o.id = $1`,
        [params.orderId],
      );
      const row = rows?.[0];
      if (!row) {
        return;
      }
      await this.router.route({
        tenantId: params.tenantId,
        userId: row.customerId,
        title: 'Order Update',
        message: `Your order is now ${params.newStatus}.`,
        type: 'order_update',
        referenceId: params.orderId,
        referenceType: 'order',
        sms: row.phoneNumber
          ? {
              phone: row.phoneNumber,
              send: () =>
                this.smsService.sendOrderStatusUpdate(row.phoneNumber, params.orderId, params.newStatus),
            }
          : null,
      });
    } catch {
      return;
    }
  }

  public async notifyOrderReady(params: {
    tenantId: string;
    orderId: string;
  }): Promise<void> {
    try {
      const rows = await this.ds.query(
        `SELECT o.customer_id AS "customerId", u.phone_number AS "phoneNumber"
         FROM orders o JOIN users u ON u.id = o.customer_id
         WHERE o.id = $1`,
        [params.orderId],
      );
      const row = rows?.[0];
      if (!row) {
        return;
      }
      await this.router.route({
        tenantId: params.tenantId,
        userId: row.customerId,
        title: 'Order Ready',
        message: 'Your order is ready for pickup by the driver.',
        type: 'order_ready',
        referenceId: params.orderId,
        referenceType: 'order',
        sms: row.phoneNumber
          ? {
              phone: row.phoneNumber,
              send: () =>
                this.smsService.sendOrderStatusUpdate(row.phoneNumber, params.orderId, 'READY'),
            }
          : null,
      });
    } catch {
      return;
    }
  }

  public async notifyUserActionNeed(params: {
    tenantId: string;
    orderId: string;
    total: number;
    currency: string;
  }): Promise<void> {
    try {
      const rows = await this.ds.query(
        `SELECT v.user_id AS "vendorUserId", u.phone_number AS "phoneNumber"
         FROM orders o
         JOIN vendors v ON v.id = o.vendor_id
         JOIN users u ON u.id = v.user_id
         WHERE o.id = $1`,
        [params.orderId],
      );
      const row = rows?.[0];
      if (!row) {
        return;
      }
      await this.router.route({
        tenantId: params.tenantId,
        userId: row.vendorUserId,
        title: 'Action Needed',
        message: 'A new order requires your action.',
        type: 'vendor_action_needed',
        referenceId: params.orderId,
        referenceType: 'order',
        sms: row.phoneNumber
          ? {
              phone: row.phoneNumber,
              send: () =>
                this.smsService.sendVendorNewOrder(
                  row.phoneNumber,
                  params.orderId,
                  params.total,
                  params.currency,
                ),
            }
          : null,
      });
    } catch {
      return;
    }
  }

  public async notifyVendorPaid(params: {
    tenantId: string;
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<void> {
    try {
      const vendorRows = await this.ds.query(
        `SELECT v.user_id AS "vendorUserId"
         FROM payments p JOIN vendors v ON v.id = p.vendor_id
         WHERE p.order_id = $1`,
        [params.orderId],
      );
      const vendorUserId = vendorRows?.[0]?.vendorUserId as string | undefined;
      if (!vendorUserId) {
        return;
      }
      const userRows = await this.ds.query(
        `SELECT phone_number AS "phoneNumber" FROM users WHERE id = $1`,
        [vendorUserId],
      );
      const phoneNumber = userRows?.[0]?.phoneNumber as string | undefined;
      await this.router.route({
        tenantId: params.tenantId,
        userId: vendorUserId,
        title: 'Payment Released',
        message: `Payment of ${params.currency} ${params.amount} for order ${params.orderId} has been released to your wallet.`,
        type: 'payment_released',
        referenceId: params.orderId,
        referenceType: 'order',
        sms: phoneNumber
          ? {
              phone: phoneNumber,
              send: () =>
                this.smsService.sendVendorCredited(
                  phoneNumber,
                  params.orderId,
                  params.amount,
                  params.currency,
                ),
            }
          : null,
      });
    } catch {
      return;
    }
  }
}
