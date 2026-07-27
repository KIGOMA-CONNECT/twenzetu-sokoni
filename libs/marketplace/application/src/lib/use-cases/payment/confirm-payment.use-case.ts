import { Inject, Injectable, Optional } from '@nestjs/common';
import { IPaymentRepository } from '@afri-market/marketplace-domain';
import { PAYMENT_REPOSITORY, MARKETPLACE_GATEWAY } from '../../tokens';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyPaymentConfirmed(userId: string, payment: Record<string, unknown>): void } | undefined,
  ) {}

  public async execute(params: {
    transactionRef: string;
    receiptNumber?: string;
  }): Promise<{ paymentId: string; status: string; message: string }> {
    const payment = await this.paymentRepo.findByTransactionRef(params.transactionRef);
    if (!payment) {
      return { paymentId: '', status: 'NOT_FOUND', message: 'Payment not found for transaction ref' };
    }

    if (payment.status !== 'PENDING') {
      return { paymentId: payment.id.value, status: payment.status, message: `Payment already ${payment.status}` };
    }

    payment.confirmEscrow();
    if (params.receiptNumber) {
      payment.setTransactionRef(params.receiptNumber);
    }
    await this.paymentRepo.save(payment);

    this.gateway?.notifyPaymentConfirmed(payment.vendorId.value, {
      paymentId: payment.id.value,
      orderId: payment.orderId.value,
      amount: payment.amount.amount,
      status: 'ESCROW_HELD',
    });

    return { paymentId: payment.id.value, status: 'ESCROW_HELD', message: 'Payment confirmed in escrow, awaiting delivery completion' };
  }
}
