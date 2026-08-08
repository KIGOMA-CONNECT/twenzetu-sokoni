import { Inject, Injectable, Optional } from '@nestjs/common';
import { IPaymentRepository } from '@afri-market/marketplace-domain';
import { PAYMENT_REPOSITORY, MARKETPLACE_GATEWAY } from '../../tokens';
import { IEventDispatcher } from '../../events/event-types';
import { NoOpEventDispatcher } from '../../events/noop-event-dispatcher';

@Injectable()
export class ConfirmPaymentUseCase {
  private readonly eventDispatcher: IEventDispatcher;

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyPaymentConfirmed(userId: string, payment: Record<string, unknown>): void } | undefined,
    @Optional() eventDispatcher?: IEventDispatcher,
  ) {
    this.eventDispatcher = eventDispatcher ?? new NoOpEventDispatcher();
  }

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

    // Dispatch async event for vendor notification
    this.eventDispatcher.dispatchPaymentConfirmed({
      paymentId: payment.id.value,
      orderId: payment.orderId.value,
      tenantId: payment.tenantId.value,
      vendorId: payment.vendorId.value,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      receiptNumber: params.receiptNumber,
    });

    return { paymentId: payment.id.value, status: 'ESCROW_HELD', message: 'Payment confirmed in escrow, awaiting delivery completion' };
  }
}
