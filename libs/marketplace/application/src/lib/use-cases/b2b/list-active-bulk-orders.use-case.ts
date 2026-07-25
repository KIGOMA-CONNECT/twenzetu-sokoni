import { Injectable, Inject } from '@nestjs/common';
import { IBulkOrderRepository } from '@afri-market/marketplace-domain';
import { BULK_ORDER_REPOSITORY } from '../../tokens';

@Injectable()
export class ListActiveBulkOrdersUseCase {
  constructor(
    @Inject(BULK_ORDER_REPOSITORY) private readonly bulkOrderRepo: IBulkOrderRepository,
  ) {}

  public async execute(tenantId: string): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const orders = await this.bulkOrderRepo.findActiveByTenant(tenantId);
    return {
      data: orders.map(o => ({
        id: o.id.value,
        productName: o.productName,
        totalQuantity: o.totalQuantity,
        totalAmount: o.totalAmount.amount,
        status: o.status,
        participantCount: o.participantVendorIds.length,
      })),
      total: orders.length,
    };
  }
}
