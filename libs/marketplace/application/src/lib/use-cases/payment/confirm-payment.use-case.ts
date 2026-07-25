import { Inject, Injectable, Optional } from '@nestjs/common';
import { IPaymentRepository, IWalletRepository } from '@afri-market/marketplace-domain';
import { PAYMENT_REPOSITORY, WALLET_REPOSITORY, MARKETPLACE_GATEWAY } from '../../tokens';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(WALLET_REPOSITORY) private readonly walletRepo: IWalletRepository,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyPaymentConfirmed(vendorId: string, data: Record<string, unknown>): void } | undefined,
  ) {}

  public async execute(params: {
    transactionRef: string;
    receiptNumber?: string;
  }): Promise<{ paymentId: string; status: string; message: string }> {
    const payment = await this.paymentRepo.findByTransactionRef(params.transactionRef);
    if (!payment) {
      return { paymentId: '', status: 'NOT_FOUND', message: 'Payment not found for transaction ref' };
    }

    if (payment.status !== 'ESCROW_HELD') {
      return { paymentId: payment.id.value, status: payment.status, message: `Payment already ${payment.status}` };
    }

    payment.release(params.receiptNumber ?? params.transactionRef);
    await this.paymentRepo.save(payment);

    const wallet = await this.walletRepo.findByOwnerId(payment.vendorId.value);
    if (wallet) {
      wallet.credit(payment.vendorNet);
      await this.walletRepo.save(wallet);
    }

    this.gateway?.notifyPaymentConfirmed(payment.vendorId.value, {
      paymentId: payment.id.value,
      orderId: payment.orderId.value,
      amount: payment.amount.amount,
      vendorNet: payment.vendorNet.amount,
    });

    return { paymentId: payment.id.value, status: 'CONFIRMED', message: 'Payment confirmed and vendor wallet credited' };
  }
}
