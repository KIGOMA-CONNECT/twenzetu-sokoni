import { Injectable, Inject } from '@nestjs/common';
import { IPaymentRepository } from '@afri-market/marketplace-domain';
import { PAYMENT_REPOSITORY } from '../../tokens';

@Injectable()
export class GetFinanceSummaryAdminUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
  ) {}

  public async execute(tenantId: string, period?: string) {
    let dateFilter: Date | undefined;
    const now = new Date();
    if (period === 'this_month') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'last_month') {
      dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    const [allRevenue, releasedRevenue, heldRevenue, vendorNetSum] = await Promise.all([
      this.paymentRepo.sumRevenue(tenantId, dateFilter ? { since: dateFilter } : {}),
      this.paymentRepo.sumRevenue(tenantId, { status: 'RELEASED', since: dateFilter }),
      this.paymentRepo.sumRevenue(tenantId, { status: 'ESCROW_HELD', since: dateFilter }),
      this.paymentRepo.sumVendorNet(tenantId, dateFilter ? { since: dateFilter } : {}),
    ]);

    return {
      data: {
        totalCommissions: allRevenue.total,
        totalVendorNet: vendorNetSum,
        totalPayments: allRevenue.count,
        releasedAmount: releasedRevenue.total,
        heldInEscrow: heldRevenue.total,
        period: period ?? 'all_time',
      },
    };
  }
}
