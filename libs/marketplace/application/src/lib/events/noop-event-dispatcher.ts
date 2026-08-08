import { Logger } from '@nestjs/common';
import {
  IEventDispatcher,
  OrderCreatedEvent,
  PaymentConfirmedEvent,
  OrderStatusChangedEvent,
  DeliveryCompletedEvent,
} from './event-types';

export class NoOpEventDispatcher implements IEventDispatcher {
  private readonly logger = new Logger(NoOpEventDispatcher.name);

  dispatchOrderCreated(event: OrderCreatedEvent): void {
    this.logger.debug(`[Event] Order created: ${event.orderId}`);
  }

  dispatchPaymentConfirmed(event: PaymentConfirmedEvent): void {
    this.logger.debug(`[Event] Payment confirmed: ${event.paymentId}`);
  }

  dispatchOrderStatusChanged(event: OrderStatusChangedEvent): void {
    this.logger.debug(`[Event] Order ${event.orderId} status: ${event.oldStatus} -> ${event.newStatus}`);
  }

  dispatchDeliveryCompleted(event: DeliveryCompletedEvent): void {
    this.logger.debug(`[Event] Delivery completed: ${event.deliveryId}`);
  }
}
