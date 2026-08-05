import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Money, TenantId } from '@afri-market/kernel';
import {
  Wallet,
  WalletTransaction,
  IPaymentRepository,
  IWalletRepository,
  IWalletTransactionRepository,
} from '@afri-market/marketplace-domain';
import { PAYMENT_REPOSITORY, WALLET_REPOSITORY, WALLET_TRANSACTION_REPOSITORY, MARKETPLACE_GATEWAY } from '../../tokens';

@Injectable()
export class ReleasePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(WALLET_REPOSITORY) private readonly walletRepo: IWalletRepository,
    @Inject(WALLET_TRANSACTION_REPOSITORY) private readonly txRepo: IWalletTransactionRepository,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyPaymentConfirmed(userId: string, payment: Record<string, unknown>): void } | undefined,
  ) {}

  public async execute(
    tenantId: string,
    orderId: string,
    caller?: { userId: string; role: string; vendorId?: string },
  ): Promise<{
    paymentId: string;
    status: string;
    vendorNetCredited: number;
    commissionRetained: number;
  }> {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException(`No payment found for order ${orderId}`);
    }
    if (payment.tenantId.value !== tenantId) {
      throw new NotFoundException(`No payment found for order ${orderId}`);
    }
    if (caller) {
      const isAdmin = caller.role === 'admin' || caller.role === 'super_admin';
      const ownsPayment = caller.userId === payment.vendorId.value || caller.vendorId === payment.vendorId.value;
      if (!isAdmin && !ownsPayment) {
        throw new ForbiddenException('You are not allowed to release this payment');
      }
    }
    if (payment.status !== 'ESCROW_HELD') {
      throw new BadRequestException(`Payment is not in ESCROW_HELD status (current: ${payment.status})`);
    }

    const vendorNet = payment.vendorNet.amount;
    const commission = payment.systemCommission.amount;

    payment.release(`release-${orderId}`);
    await this.paymentRepo.save(payment);

    let vendorWallet = await this.walletRepo.findByOwnerId(payment.vendorId.value, tenantId);
    const vendorBalanceBefore = vendorWallet ? vendorWallet.balance.amount : 0;
    if (!vendorWallet) {
      vendorWallet = Wallet.create({
        tenantId: TenantId.create(tenantId),
        ownerId: payment.vendorId,
        ownerType: 'vendor',
        currency: payment.amount.currency,
      });
    }
    vendorWallet.credit(Money.create(vendorNet, payment.amount.currency));
    await this.walletRepo.save(vendorWallet);

    const tx = WalletTransaction.create({
      tenantId: TenantId.create(tenantId),
      ownerId: payment.vendorId,
      ownerType: 'vendor',
      type: 'CREDIT',
      amount: Money.create(vendorNet, payment.amount.currency),
      balanceBefore: vendorBalanceBefore,
      balanceAfter: vendorWallet.balance.amount,
      description: `Payment release for order ${orderId}`,
      referenceId: payment.id.value,
      referenceType: 'payment',
    });
    await this.txRepo.save(tx);

    this.gateway?.notifyPaymentConfirmed(payment.vendorId.value, {
      paymentId: payment.id.value,
      orderId,
      amount: vendorNet,
      currency: payment.amount.currency,
    });

    return {
      paymentId: payment.id.value,
      status: 'RELEASED',
      vendorNetCredited: vendorNet,
      commissionRetained: commission,
    };
  }
}
