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
} from '@afri-market/marketplace-domain';
import { CommissionEngine, ISmsService, IEmailService, IMobileMoneyService, InitiateStkPushParams, getCurrencyForPhone } from '@afri-market/integrations';
import { ORDER_REPOSITORY, VENDOR_REPOSITORY, PAYMENT_REPOSITORY, PRODUCT_REPOSITORY, MARKETPLACE_GATEWAY, SMS_SERVICE, EMAIL_SERVICE, MOBILE_MONEY_SERVICE } from '../../tokens';
import { CreateOrderCommand } from '../../commands/create-order.command';
import { IEventDispatcher } from '../../events/event-types';
import { NoOpEventDispatcher } from '../../events/noop-event-dispatcher';
import { GetWalletUseCase } from '../wallet/get-wallet.use-case';
import { DebitWalletUseCase } from '../wallet/debit-wallet.use-case';
import { FindVendorsUseCase } from '../vendor/find-vendors.use-case';

@Injectable()
export class CreateOrderUseCase {
  private readonly eventDispatcher: IEventDispatcher;

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly wallet: GetWalletUseCase,
    private readonly debitWallet: DebitWalletUseCase,
    private readonly findVendors: FindVendorsUseCase,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyNewOrder(vendorId: string, order: Record<string, unknown>): void } | undefined,
    @Optional() @Inject(SMS_SERVICE) private readonly smsService?: ISmsService,
    @Optional() @Inject(EMAIL_SERVICE) private readonly emailService?: IEmailService,
    @Optional() @Inject(MOBILE_MONEY_SERVICE) private readonly mobileMoneyService?: IMobileMoneyService,
    @Optional() eventDispatcher?: IEventDispatcher,
  ) {
    this.eventDispatcher = eventDispatcher ?? new NoOpEventDispatcher();
  }

  private async resolveWalletOwner(userId: string): Promise<string> {
    const vendor = await this.findVendors.findByUserId(userId);
    if (vendor) {
      return vendor.id.value;
    }
    return userId;
  }

  public async execute(
    tenantId: string,
    command: CreateOrderCommand,
  ): Promise<{
    orderId: string;
    status: string;
    total: number;
    commission: number;
    vendorNet: number;
    deliveryFee: number;
    paymentId: string;
    paymentStatus: string;
    otpCode: string;
    checkoutUrl?: string;
  }> {
    Guard.assert(command.items.length > 0, 'Order must have at least one item');

    const vendor = await this.vendorRepo.findById(
      EntityId.from(command.vendorId),
    );
    Guard.assert(vendor, 'Vendor not found');
    Guard.assert(vendor!.status === 'ACTIVE', 'Vendor is not active');

    const isServiceOrder = command.type === 'service';
    const validatedItems: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }> = [];
    if (isServiceOrder) {
      // Service orders are built from service requests/quotes and have no
      // inventory product row; use the item data as provided.
      for (const item of command.items) {
        Guard.assert(item.quantity > 0, `Quantity must be positive for ${item.productName}`);
        Guard.assert(item.unitPrice >= 0, `Price cannot be negative for ${item.productName}`);
        validatedItems.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }
    } else {
      for (const item of command.items) {
        const product = await this.productRepo.findById(EntityId.from(item.productId));
        Guard.assert(product, `Product ${item.productName} is no longer available`);
        Guard.assert(product!.status === 'ACTIVE', `Product ${item.productName} is not available`);
        Guard.assert(product!.vendorId.value === vendor!.id.value, `Product ${item.productName} does not belong to this vendor`);
        Guard.assert(product!.stockQuantity >= item.quantity, `Insufficient stock for ${item.productName}`);
        validatedItems.push({
          productId: product!.id.value,
          productName: product!.name,
          quantity: item.quantity,
          unitPrice: product!.price.amount,
        });
      }
    }

    const currency = command.currency ?? getCurrencyForPhone(command.customerPhone ?? '');

    let deliveryFee = 0;
    if (
      vendor!.latitude != null &&
      vendor!.longitude != null &&
      command.deliveryLatitude != null &&
      command.deliveryLongitude != null
    ) {
      deliveryFee = DeliveryFareCalculator.calculate({
        pickupLatitude: vendor!.latitude,
        pickupLongitude: vendor!.longitude,
        dropLatitude: command.deliveryLatitude,
        dropLongitude: command.deliveryLongitude,
        vehicleType: 'boda',
        currency,
      }).totalFare;
    }

    const commissionSplit = CommissionEngine.calculate({
      items: validatedItems.map((i) => ({
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      vendorCommissionRate: vendor!.commissionRate,
      deliveryFee,
      currency,
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

    const otpCode = randomInt(0, 10000).toString().padStart(4, '0');
    order.setOTP(otpCode);

    await this.orderRepo.save(order);

    for (const item of validatedItems) {
      await this.ds.query(
        `INSERT INTO order_items (id, tenant_id, order_id, product_id, product_name, quantity, unit_price, total_price, currency, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [tenantId, order.id.value, item.productId, item.productName, item.quantity, item.unitPrice, item.unitPrice * item.quantity, currency],
      );
    }

    if (!isServiceOrder) {
      for (const item of validatedItems) {
        const product = await this.productRepo.findById(EntityId.from(item.productId));
        if (product) {
          product.reduceStock(item.quantity);
          await this.productRepo.save(product);
        }
      }
    }

    const paymentMethod = (command.paymentMethod as 'mpesa' | 'tigo_money' | 'tigo_pesa' | 'airtel_money' | 'halotel' | 'azampesa' | 'wallet' | 'card' | 'cash') || 'mpesa';

    const payment = Payment.create({
      tenantId: TenantId.create(tenantId),
      orderId: EntityId.from(order.id.value),
      customerId: EntityId.from(command.customerId),
      vendorId: EntityId.from(command.vendorId),
      amount: commissionSplit.totalPaid,
      method: paymentMethod,
      systemCommission: commissionSplit.systemCommission,
      vendorNet: commissionSplit.vendorNet,
      driverNet: commissionSplit.deliveryFee,
    });

    await this.paymentRepo.save(payment);

    const customerPhone = command.customerPhone;
    const customerEmail = command.customerEmail;

    // Dispatch event for async notification processing (SMS, email, etc.)
    // This decouples notification delivery from order creation for resilience
    this.eventDispatcher.dispatchOrderCreated({
      orderId: order.id.value,
      tenantId,
      customerId: command.customerId,
      vendorId: command.vendorId,
      total: commissionSplit.totalPaid.amount,
      currency,
      otpCode,
      customerPhone,
      customerEmail,
      vendorPhone: vendor?.userId ? undefined : undefined,
      paymentMethod,
    });

    let checkoutUrl: string | undefined;

    switch (paymentMethod) {
      case 'cash':
        payment.confirmEscrow();
        await this.paymentRepo.save(payment);
        break;

      case 'wallet': {
        const ownerId = await this.resolveWalletOwner(command.customerId);
        try {
          await this.debitWallet.execute(
            tenantId,
            ownerId,
            commissionSplit.totalPaid.amount,
            `Order payment: ${order.id.value}`,
            order.id.value,
            'order_payment',
          );
          payment.confirmEscrow();
          await this.paymentRepo.save(payment);
        } catch {
          payment.fail();
          await this.paymentRepo.save(payment);
        }
        break;
      }

      case 'card': {
        const cardRef = `card_${order.id.value}`;
        try {
          const cardResult = await this.mobileMoneyService?.initiateCardCheckout({
            amount: commissionSplit.totalPaid.amount,
            accountReference: cardRef,
            description: `Payment for order ${order.id.value}`,
            currency,
          });
          if (cardResult?.success && cardResult.checkoutUrl) {
            payment.setTransactionRef(cardRef);
            await this.paymentRepo.save(payment);
            checkoutUrl = cardResult.checkoutUrl;
          } else {
            payment.fail();
            await this.paymentRepo.save(payment);
          }
        } catch {
          payment.fail();
          await this.paymentRepo.save(payment);
        }
        break;
      }

      default:
        if (customerPhone) {
          try {
            const stkResult = await this.mobileMoneyService?.initiateStkPush({
              phoneNumber: customerPhone,
              amount: commissionSplit.totalPaid.amount,
              accountReference: order.id.value,
              description: `Payment for order ${order.id.value}`,
              provider: paymentMethod as InitiateStkPushParams['provider'],
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
        break;
    }

    this.gateway?.notifyNewOrder(command.vendorId, {
      orderId: order.id.value,
      status: order.status,
      total: commissionSplit.totalPaid.amount,
      vendorId: command.vendorId,
    });

    // Vendor phone lookup and SMS is now handled by the event dispatcher
    // The dispatchOrderCreated event includes vendorId for async vendor notification

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
      checkoutUrl,
    };
  }
}
