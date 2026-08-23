import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProductSaleRepository, IPosShiftRepository } from '@afri-market/marketplace-domain';
import { PRODUCT_SALE_REPOSITORY, POS_SHIFT_REPOSITORY } from '../../tokens';
import { startOfLocalDay, endOfLocalDay, parseDateInput, formatDate } from './pos-dates';

export interface GetPosDayReportInput {
  readonly tenantId: string;
  readonly vendorId: string;
  readonly date?: string;
  readonly shiftId?: string;
}

@Injectable()
export class GetPosDayReportUseCase {
  constructor(
    @Inject(PRODUCT_SALE_REPOSITORY) private readonly saleRepo: IProductSaleRepository,
    @Inject(POS_SHIFT_REPOSITORY) private readonly shiftRepo: IPosShiftRepository,
  ) {}

  public async execute(input: GetPosDayReportInput) {
    const selected = parseDateInput(input.date);
    let sales;

    if (input.shiftId) {
      const { EntityId } = await import('@afri-market/kernel');
      const shift = await this.shiftRepo.findById(EntityId.from(input.shiftId));
      if (!shift) throw new NotFoundException('Shift not found');
      sales = await this.saleRepo.findByVendorBetween(
        input.vendorId,
        shift.openedAt,
        shift.closedAt ?? new Date(),
      );
    } else {
      sales = await this.saleRepo.findByVendorBetween(
        input.vendorId,
        startOfLocalDay(selected),
        endOfLocalDay(selected),
      );
    }

    const completed = sales.filter((s) => s.status === 'COMPLETED');
    let totalRevenue = 0;
    let itemCount = 0;
    const byMethod: Record<string, number> = {};

    for (const sale of completed) {
      totalRevenue += sale.total.amount;
      itemCount += sale.items.reduce((sum, item) => sum + item.quantity, 0);
      byMethod[sale.paymentMethod] = (byMethod[sale.paymentMethod] ?? 0) + sale.total.amount;
    }

    const paymentBreakdown = Object.entries(byMethod).map(([method, amount]) => ({ method, amount }));

    return {
      date: formatDate(selected),
      shopName: undefined as string | undefined,
      totalRevenue,
      transactionCount: completed.length,
      itemCount,
      averageSale: completed.length > 0 ? totalRevenue / completed.length : 0,
      currency: completed[0]?.total.currency ?? 'TZS',
      paymentBreakdown,
      sales: sales.map((s) => s.toDto()),
    };
  }
}
