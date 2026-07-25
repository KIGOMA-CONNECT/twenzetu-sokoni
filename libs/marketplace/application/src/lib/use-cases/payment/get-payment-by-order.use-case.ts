import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPaymentRepository } from '@afri-market/marketplace-domain';
import { PAYMENT_REPOSITORY } from '../../tokens';

@Injectable()
export class GetPaymentByOrderUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
  ) {}

  public async execute(
    tenantId: string,
    orderId: string,
  ): Promise<{ id: string; orderId: string; status: string; amount: number; method: string; vendorId: string }> {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment || payment.tenantId.value !== tenantId) {
      throw new NotFoundException('Payment not found');
    }
    return {
      id: payment.id.value,
      orderId: payment.orderId.value,
      status: payment.status,
      amount: payment.amount.amount,
      method: payment.method,
      vendorId: payment.vendorId.value,
    };
  }
}
