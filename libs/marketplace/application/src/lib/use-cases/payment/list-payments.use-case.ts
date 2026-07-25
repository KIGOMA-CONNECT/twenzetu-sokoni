import { Injectable, Inject } from '@nestjs/common';
import { IPaymentRepository, PaymentSearchFilters } from '@afri-market/marketplace-domain';
import { PAYMENT_REPOSITORY } from '../../tokens';

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
  ) {}

  public async execute(
    tenantId: string,
    filters: PaymentSearchFilters,
  ): Promise<{ data: { id: string; orderId: string; status: string; amount: number; method: string; vendorId: string }[]; total: number }> {
    const result = await this.paymentRepo.search(tenantId, filters);
    return {
      data: result.data.map(p => ({
        id: p.id.value,
        orderId: p.orderId.value,
        status: p.status,
        amount: p.amount.amount,
        method: p.method,
        vendorId: p.vendorId.value,
      })),
      total: result.total,
    };
  }
}
