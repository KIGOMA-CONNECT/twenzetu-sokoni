import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IPaymentRepository } from '@afri-market/marketplace-domain';
import { PAYMENT_REPOSITORY } from '../../tokens';

@Injectable()
export class FailPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
  ) {}

  public async execute(params: {
    transactionRef: string;
    reason?: string;
  }): Promise<{ paymentId: string; status: string }> {
    const payment = await this.paymentRepo.findByTransactionRef(params.transactionRef);
    if (!payment) {
      return { paymentId: '', status: 'NOT_FOUND' };
    }

    if (payment.status === 'PENDING') {
      payment.fail();
      await this.paymentRepo.save(payment);
    }

    return { paymentId: payment.id.value, status: payment.status };
  }
}
