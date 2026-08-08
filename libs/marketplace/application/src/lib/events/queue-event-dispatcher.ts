import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  IEventDispatcher,
  OrderCreatedEvent,
  PaymentConfirmedEvent,
  OrderStatusChangedEvent,
  DeliveryCompletedEvent,
} from './event-types';

export class QueueEventDispatcher implements IEventDispatcher {
  private readonly logger = new Logger(QueueEventDispatcher.name);

  constructor(
    @InjectQueue('orders') private readonly ordersQueue: Queue,
    @InjectQueue('payments') private readonly paymentsQueue: Queue,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async dispatchOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      await this.ordersQueue.add('order-created', event, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      this.logger.debug(`Order created event dispatched: ${event.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to dispatch order created event: ${error}`);
    }
  }

  async dispatchPaymentConfirmed(event: PaymentConfirmedEvent): Promise<void> {
    try {
      await this.paymentsQueue.add('payment-confirmed', event, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      this.logger.debug(`Payment confirmed event dispatched: ${event.paymentId}`);
    } catch (error) {
      this.logger.error(`Failed to dispatch payment confirmed event: ${error}`);
    }
  }

  async dispatchOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    try {
      await this.ordersQueue.add('order-status-changed', event, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      this.logger.debug(`Order status changed event dispatched: ${event.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to dispatch order status changed event: ${error}`);
    }
  }

  async dispatchDeliveryCompleted(event: DeliveryCompletedEvent): Promise<void> {
    try {
      await this.ordersQueue.add('delivery-completed', event, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      this.logger.debug(`Delivery completed event dispatched: ${event.deliveryId}`);
    } catch (error) {
      this.logger.error(`Failed to dispatch delivery completed event: ${error}`);
    }
  }
}
