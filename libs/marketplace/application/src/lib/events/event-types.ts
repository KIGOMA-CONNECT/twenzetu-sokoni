export interface OrderCreatedEvent {
  orderId: string;
  tenantId: string;
  customerId: string;
  vendorId: string;
  total: number;
  currency: string;
  otpCode: string;
  customerPhone?: string;
  customerEmail?: string;
  vendorPhone?: string;
  paymentMethod: string;
}

export interface PaymentConfirmedEvent {
  paymentId: string;
  orderId: string;
  tenantId: string;
  vendorId: string;
  amount: number;
  currency: string;
  receiptNumber?: string;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  tenantId: string;
  customerId: string;
  vendorId: string;
  oldStatus: string;
  newStatus: string;
  customerPhone?: string;
}

export interface DeliveryCompletedEvent {
  deliveryId: string;
  orderId: string;
  tenantId: string;
  customerId: string;
  vendorId: string;
  driverId: string;
  total: number;
  vendorNet: number;
  driverNet: number;
  currency: string;
  customerPhone?: string;
  vendorPhone?: string;
  driverPhone?: string;
}

export interface IEventDispatcher {
  dispatchOrderCreated(event: OrderCreatedEvent): void;
  dispatchPaymentConfirmed(event: PaymentConfirmedEvent): void;
  dispatchOrderStatusChanged(event: OrderStatusChangedEvent): void;
  dispatchDeliveryCompleted(event: DeliveryCompletedEvent): void;
}
