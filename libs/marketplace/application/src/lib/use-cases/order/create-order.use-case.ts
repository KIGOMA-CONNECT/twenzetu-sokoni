import { Inject, Injectable, Optional } from '@nestjs/common';
import { EntityId, Guard, TenantId } from '@afri-market/kernel';
import {
  Order,
  Payment,
  IVendorRepository,
  IOrderRepository,
  IPaymentRepository,
  OrderType,
} from '@afri-market/marketplace-domain';
import { CommissionEngine, ISmsService, IEmailService, IMobileMoneyService } from '@afri-market/integrations';
import { ORDER_REPOSITORY, VENDOR_REPOSITORY, PAYMENT_REPOSITORY, MARKETPLACE_GATEWAY, SMS_SERVICE, EMAIL_SERVICE, MOBILE_MONEY_SERVICE } from '../../tokens';
import { CreateOrderCommand } from '../../commands/create-order.command';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyNewOrder(vendorId: string, order: Record<string, unknown>): void } | undefined,
    @Optional() @Inject(SMS_SERVICE) private readonly smsService?: ISmsService,
    @Optional() @Inject(EMAIL_SERVICE) private readonly emailService?: IEmailService,
    @Optional() @Inject(MOBILE_MONEY_SERVICE) private readonly mobileMoneyService?: IMobileMoneyService,
  ) {}

  public async execute(
    tenantId: string,
    command: CreateOrderCommand,
  ): Promise<{
    orderId: string;
    total: number;
    commission: number;
    vendorNet: number;
    deliveryFee: number;
    paymentId: string;
    paymentStatus: string;
  }> {
    Guard.assert(command.items.length > 0, 'Order must have at least one item');

    const vendor = await this.vendorRepo.findById(
      EntityId.from(command.vendorId),
    );
    Guard.assert(vendor, 'Vendor not found');
    Guard.assert(vendor!.status === 'ACTIVE', 'Vendor is not active');

    const commissionSplit = CommissionEngine.calculate({
      items: command.items.map((i) => ({
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      vendorCommissionRate: vendor!.commissionRate,
      deliveryFee: 0,
    });

    const order = Order.create({
      tenantId: TenantId.create(tenantId),
      customerId: EntityId.from(command.customerId),
      vendorId: EntityId.from(command.vendorId),
      type: command.type as OrderType,
      deliveryAddress: command.deliveryAddress,
      deliveryLatitude: command.deliveryLatitude,
      deliveryLongitude: command.deliveryLongitude,
      specialInstructions: command.specialInstructions,
    });

    order.calculateTotals(
      commissionSplit.itemsSubtotal,
      commissionSplit.deliveryFee,
      vendor!.commissionRate,
    );

    await this.orderRepo.save(order);

    const payment = Payment.create({
      tenantId: TenantId.create(tenantId),
      orderId: EntityId.from(order.id.value),
      customerId: EntityId.from(command.customerId),
      vendorId: EntityId.from(command.vendorId),
      amount: commissionSplit.totalPaid,
      method: 'mpesa',
      systemCommission: commissionSplit.systemCommission,
      vendorNet: commissionSplit.vendorNet,
      driverNet: commissionSplit.deliveryFee,
    });

    await this.paymentRepo.save(payment);

    const customerPhone = command.customerPhone;
    const customerEmail = command.customerEmail;

    if (customerPhone) {
      this.smsService?.send({
        to: customerPhone,
        message: `Order ${order.id.value} confirmed. Total: ${commissionSplit.totalPaid.amount} ${commissionSplit.totalPaid.currency}`,
      });
    }

    if (customerEmail) {
      this.emailService?.sendOrderConfirmation(
        customerEmail,
        order.id.value,
        commissionSplit.totalPaid.amount,
      );
    }

    if (customerPhone) {
      this.mobileMoneyService?.initiateStkPush({
        phoneNumber: customerPhone,
        amount: commissionSplit.totalPaid.amount,
        accountReference: order.id.value,
        description: `Payment for order ${order.id.value}`,
      });
    }

    this.gateway?.notifyNewOrder(command.vendorId, {
      orderId: order.id.value,
      status: order.status,
      total: commissionSplit.totalPaid.amount,
      vendorId: command.vendorId,
    });

    return {
      orderId: order.id.value,
      total: commissionSplit.totalPaid.amount,
      commission: commissionSplit.systemCommission.amount,
      vendorNet: commissionSplit.vendorNet.amount,
      deliveryFee: commissionSplit.deliveryFee.amount,
      paymentId: payment.id.value,
      paymentStatus: payment.status,
    };
  }
}
