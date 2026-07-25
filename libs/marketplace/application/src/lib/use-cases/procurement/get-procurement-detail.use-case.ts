import { Injectable, Inject } from '@nestjs/common';
import { ICustomProcurementRepository, IVendorQuoteRepository } from '@afri-market/marketplace-domain';
import { PROCUREMENT_REPOSITORY, VENDOR_QUOTE_REPOSITORY } from '../../tokens';

@Injectable()
export class GetProcurementDetailUseCase {
  constructor(
    @Inject(PROCUREMENT_REPOSITORY) private readonly procurementRepo: ICustomProcurementRepository,
    @Inject(VENDOR_QUOTE_REPOSITORY) private readonly quoteRepo: IVendorQuoteRepository,
  ) {}

  public async execute(tenantId: string, procurementId: string): Promise<{ procurement: Record<string, unknown> | null; quotes: Record<string, unknown>[] }> {
    const { EntityId } = await import('@afri-market/kernel');
    const procurement = await this.procurementRepo.findById(EntityId.from(procurementId));
    if (!procurement) {
      return { procurement: null, quotes: [] };
    }
    const quotes = await this.quoteRepo.findByProcurementId(procurementId);
    return {
      procurement: { id: procurement.id.value, productQuery: procurement.productQuery, status: procurement.status },
      quotes: quotes.map(q => ({ id: q.id.value, vendorId: q.vendorId.value, price: q.price.amount, itemCondition: q.itemCondition })),
    };
  }
}
