import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import {
  Delivery,
  CustomerPoints,
  Wallet,
  WalletTransaction,
  IOrderRepository,
  ICustomerPointsRepository,
  IPaymentRepository,
  IWalletRepository,
  IWalletTransactionRepository,
} from '@afri-market/marketplace-domain';
import {
  ORDER_REPOSITORY,
  DELIVERY_REPOSITORY,
  CUSTOMER_POINTS_REPOSITORY,
  PAYMENT_REPOSITORY,
  WALLET_REPOSITORY,
  WALLET_TRANSACTION_REPOSITORY,
  MARKETPLACE_GATEWAY,
} from '../../tokens';
import { IDeliveryRepository } from './create-delivery.use-case';

export interface ICompleteDeliveryRepository extends IDeliveryRepository {
  findByOrderId(orderId: string): Promise<Delivery | null>;
  save(delivery: Delivery): Promise<void>;
}

@Injectable()
export class CompleteDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: ICompleteDeliveryRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(CUSTOMER_POINTS_REPOSITORY) private readonly pointsRepo: ICustomerPointsRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Optional() @Inject(WALLET_REPOSITORY) private readonly walletRepo: IWalletRepository | undefined,
    @Optional() @Inject(WALLET_TRANSACTION_REPOSITORY) private readonly txRepo: IWalletTransactionRepository | undefined,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyDeliveryStatusChanged(orderId: string, driverId: string, delivery: Record<string, unknown>): void } | undefined,
  ) {}

  public async execute(tenantId: string, params: {
    deliveryId: string;
    driverEarnings: number;
    deliveryOtp?: string;
  }): Promise<{
    deliveryId: string;
    orderId: string;
    status: string;
    driverEarnings: number;
    loyaltyPointsEarned: number;
    paymentReleased: boolean;
    vendorAmountCredited: number;
    driverAmountCredited: number;
    otpVerified: boolean;
  }> {
    const delivery = await this.deliveryRepo.findById(EntityId.from(params.deliveryId));
    if (!delivery) throw new Error('Delivery not found');

    const order = await this.orderRepo.findById(delivery.orderId);
    if (!order) throw new Error('Order not found');

    if (order.otpCode && !order.otpVerified) {
      if (!params.deliveryOtp || params.deliveryOtp.trim() !== order.otpCode) {
        throw new BadRequestException('Invalid delivery confirmation code. Delivery cannot be completed and payment will not be released.');
      }
      order.verifyOTP();
    }

    const driverEarnings = Money.create(params.driverEarnings);
    delivery.complete(driverEarnings);
    await this.deliveryRepo.save(delivery);

    order.deliver();
    await this.orderRepo.save(order);

    const pointsEarned = Math.floor(order.totalAmount.amount / 100);
    let points = await this.pointsRepo.findByCustomerId(order.customerId.value);
    if (!points) {
      points = CustomerPoints.create({
        tenantId: delivery.tenantId,
        customerId: order.customerId,
      });
    }
    points.earnPoints(pointsEarned, `Order ${order.id.value} delivered`);
    await this.pointsRepo.save(points);

    let paymentReleased = false;
    let vendorAmountCredited = 0;
    let driverAmountCredited = 0;

    const payment = await this.paymentRepo.findByOrderId(order.id.value);
    if (payment && payment.status === 'ESCROW_HELD') {
      payment.release(`delivery-${Date.now()}`);
      await this.paymentRepo.save(payment);

      if (this.walletRepo) {
        const vendorNet = payment.vendorNet.amount;
        const driverNet = payment.driverNet.amount;

        let vendorWallet = await this.walletRepo.findByOwnerId(payment.vendorId.value);
        const vendorBalanceBefore = vendorWallet ? vendorWallet.balance.amount : 0;
        if (!vendorWallet) {
          vendorWallet = Wallet.create({
            tenantId: TenantId.create(tenantId),
            ownerId: payment.vendorId,
            ownerType: 'vendor',
          });
          vendorWallet.credit(Money.create(vendorNet, payment.amount.currency));
        } else {
          vendorWallet.credit(Money.create(vendorNet, payment.amount.currency));
        }
        await this.walletRepo.save(vendorWallet);

        if (this.txRepo) {
          const vtx = WalletTransaction.create({
            tenantId: TenantId.create(tenantId),
            ownerId: payment.vendorId,
            ownerType: 'vendor',
            type: 'CREDIT',
            amount: Money.create(vendorNet, payment.amount.currency),
            balanceBefore: vendorBalanceBefore,
            balanceAfter: vendorWallet.balance.amount,
            description: `Payment auto-release for order ${order.id.value}`,
            referenceId: payment.id.value,
            referenceType: 'payment',
          });
          await this.txRepo.save(vtx);
        }

        if (driverNet > 0) {
          let driverWallet = await this.walletRepo.findByOwnerId(delivery.driverId.value);
          const driverBalanceBefore = driverWallet ? driverWallet.balance.amount : 0;
          if (!driverWallet) {
            driverWallet = Wallet.create({
              tenantId: TenantId.create(tenantId),
              ownerId: delivery.driverId,
              ownerType: 'vendor',
            });
          }
          driverWallet.credit(Money.create(driverNet, payment.amount.currency));
          await this.walletRepo.save(driverWallet);

          if (this.txRepo) {
            const dtx = WalletTransaction.create({
              tenantId: TenantId.create(tenantId),
              ownerId: delivery.driverId,
              ownerType: 'vendor',
              type: 'CREDIT',
              amount: Money.create(driverNet, payment.amount.currency),
              balanceBefore: driverBalanceBefore,
              balanceAfter: driverWallet.balance.amount,
              description: `Driver earnings for order ${order.id.value}`,
              referenceId: payment.id.value,
              referenceType: 'payment',
            });
            await this.txRepo.save(dtx);
          }

          driverAmountCredited = driverNet;
        }

        vendorAmountCredited = vendorNet;
        paymentReleased = true;
      }
    }

    this.gateway?.notifyDeliveryStatusChanged(order.id.value, delivery.driverId.value, {
      deliveryId: delivery.id.value,
      status: 'DELIVERED',
      orderId: order.id.value,
      paymentReleased,
    });

    return {
      deliveryId: delivery.id.value,
      orderId: order.id.value,
      status: 'DELIVERED',
      driverEarnings: driverEarnings.amount,
      loyaltyPointsEarned: pointsEarned,
      paymentReleased,
      vendorAmountCredited,
      driverAmountCredited,
      otpVerified: order.otpVerified,
    };
  }
}
