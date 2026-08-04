import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomInt } from 'crypto';
import { EntityId, Guard, TenantId } from '@afri-market/kernel';
import {
  Order,
  Payment,
  IVendorRepository,
  IOrderRepository,
  IPaymentRepository,
  IProductRepository,
  OrderType,
  DeliveryFareCalculator,
  PaymentMethod,
} from '@afri-market/marketplace-domain';
import { CommissionEngine, ISmsService, IEmailService, IMobileMoneyService, InitiateStkPushParams, getCurrencyForPhone } from '@afri-market/integrations';
import { ORDER_REPOSITORY, VENDOR_REPOSITORY, PAYMENT_REPOSITORY, PRODUCT_REPOSITORY, CART_REPOSITORY, MARKETPLACE_GATEWAY, SMS_SERVICE, EMAIL_SERVICE, MOBILE_MONEY_SERVICE } from '../../tokens';
import { ICartRepository } from '@afri-market/marketplace-domain';

export interface CheckoutCartInput {
  tenantId: string;
  userId: string;
  cartId: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  specialInstructions?: string;
  customerPhone?: string;
  customerEmail?: string;
  currency?: string;
}

export interface CheckoutCartResult {
  orderId: string;
  status: string;
  total: number;
  commission: number;
  vendorNet: number;
  deliveryFee: number;
  paymentId: string;
  paymentStatus: string;
  otpCode: string;
}

@Injectable()
export class CheckoutCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @InjectDataSource() private readonly ds: DataSource,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyNewOrder(vendorId: string, order: Record<string, unknown>): void } | undefined,
    @Optional() @Inject(SMS_SERVICE) private readonly smsService?: ISmsService,
    @Optional() @Inject(EMAIL_SERVICE) private readonly emailService?: IEmailService,
    @Optional() @Inject(MOBILE_MONEY_SERVICE) private readonly mobileMoneyService?: IMobileMoneyService,
  ) {}

  public async execute(input: CheckoutCartInput): Promise<CheckoutCartResult> {
    const cart = await this.cartRepo.findByIdAndUser(input.cartId, input.userId, input.tenantId);
    Guard.assert(cart, 'Cart not found');
    Guard.assert(cart!.items.length > 0, 'Cart is empty');

    const vendor = await this.vendorRepo.findById(cart!.vendorId);
    Guard.assert(vendor, 'Vendor not found');
    Guard.assert(vendor!.status === 'ACTIVE', 'Vendor is not active');

    const currency = input.currency ?? getCurrencyForPhone(input.customerPhone ?? '');

    const validated = [] as Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      currency: string;
    }>;

    for (const item of cart!.items) {
      const product = await this.productRepo.findById(item.productId);
      Guard.assert(product, `Product ${item.productName} is no longer available`);
      Guard.assert(product!.status === 'ACTIVE', `Product ${item.productName} is not available`);
      Guard.assert(product!.vendorId.value === cart!.vendorId.value, `Product ${item.productName} does not belong to this vendor`);
      Guard.assert(product!.stockQuantity >= item.quantity, `Insufficient stock for ${item.productName}`);
      validated.push({
        productId: product!.id.value,
        productName: product!.name,
        quantity: item.quantity,
        unitPrice: product!.price.amount,
        currency: product!.price.currency,
      });
    }

    let deliveryFee = 0;
    if (
      vendor!.latitude != null &&
      vendor!.longitude != null &&
      input.deliveryLatitude != null &&
      input.deliveryLongitude != null
    ) {
      deliveryFee = DeliveryFareCalculator.calculate({
        pickupLatitude: vendor!.latitude,
        pickupLongitude: vendor!.longitude,
        dropLatitude: input.deliveryLatitude,
        dropLongitude: input.deliveryLongitude,
        vehicleType: 'boda',
        currency,
      }).totalFare;
    }

    const commissionSplit = CommissionEngine.calculate({
      items: validated.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
      vendorCommissionRate: vendor!.commissionRate,
      deliveryFee,
      currency,
    });

    const order = Order.create({
      tenantId: TenantId.create(input.tenantId),
      customerId: EntityId.from(input.userId),
      vendorId: cart!.vendorId,
      type: 'general' as OrderType,
      deliveryAddress: input.deliveryAddress,
      deliveryLatitude: input.deliveryLatitude,
      deliveryLongitude: input.deliveryLongitude,
      specialInstructions: input.specialInstructions,
    });

    order.calculateTotals(
      commissionSplit.itemsSubtotal,
      commissionSplit.deliveryFee,
      vendor!.commissionRate,
    );

    const otpCode = randomInt(0, 10000).toString().padStart(4, '0');
    order.setOTP(otpCode);

    await this.orderRepo.save(order);

    const payment = Payment.create({
      tenantId: TenantId.create(input.tenantId),
      orderId: EntityId.from(order.id.value),
      customerId: EntityId.from(input.userId),
      vendorId: cart!.vendorId,
      amount: commissionSplit.totalPaid,
      method: input.paymentMethod as PaymentMethod,
      systemCommission: commissionSplit.systemCommission,
      vendorNet: commissionSplit.vendorNet,
      driverNet: commissionSplit.deliveryFee,
    });

    await this.paymentRepo.save(payment);

    for (const item of validated) {
      await this.ds.query(
        `INSERT INTO order_items (id, tenant_id, order_id, product_id, product_name, quantity, unit_price, total_price, currency, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [input.tenantId, order.id.value, item.productId, item.productName, item.quantity, item.unitPrice, item.unitPrice * item.quantity, item.currency],
      );
    }

    for (const item of cart!.items) {
      const product = await this.productRepo.findById(item.productId);
      if (product) {
        product.reduceStock(item.quantity);
        await this.productRepo.save(product);
      }
    }

    if (input.customerPhone) {
      this.smsService?.sendDeliveryOtp(input.customerPhone, otpCode, order.id.value);
    }

    if (input.customerEmail) {
      this.emailService?.sendOrderConfirmation(
        input.customerEmail,
        order.id.value,
        commissionSplit.totalPaid.amount,
        currency,
      );
    }

    if (input.paymentMethod === 'cash') {
      payment.confirmEscrow();
      await this.paymentRepo.save(payment);
    } else if (input.customerPhone) {
      try {
        const stkResult = await this.mobileMoneyService?.initiateStkPush({
          phoneNumber: input.customerPhone,
          amount: commissionSplit.totalPaid.amount,
          accountReference: order.id.value,
          description: `Payment for order ${order.id.value}`,
          provider: input.paymentMethod as InitiateStkPushParams['provider'],
        });
        if (stkResult?.checkoutRequestId) {
          payment.setTransactionRef(stkResult.checkoutRequestId);
          await this.paymentRepo.save(payment);
        }
      } catch {
        payment.fail();
        await this.paymentRepo.save(payment);
      }
    }

    this.gateway?.notifyNewOrder(cart!.vendorId.value, {
      orderId: order.id.value,
      status: order.status,
      total: commissionSplit.totalPaid.amount,
      vendorId: cart!.vendorId.value,
    });

    cart!.markCheckedOut();
    await this.cartRepo.save(cart!);

    return {
      orderId: order.id.value,
      status: order.status,
      total: commissionSplit.totalPaid.amount,
      commission: commissionSplit.systemCommission.amount,
      vendorNet: commissionSplit.vendorNet.amount,
      deliveryFee: commissionSplit.deliveryFee.amount,
      paymentId: payment.id.value,
      paymentStatus: payment.status,
      otpCode,
    };
  }
}
