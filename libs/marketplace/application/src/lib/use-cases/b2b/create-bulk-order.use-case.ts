import { Inject, Injectable } from '@nestjs/common';
import { Money, TenantId } from '@afri-market/kernel';
import { BulkOrder, IBulkOrderRepository } from '@afri-market/marketplace-domain';
import { BULK_ORDER_REPOSITORY } from '../../tokens';

@Injectable()
export class CreateBulkOrderUseCase {
  constructor(
    @Inject(BULK_ORDER_REPOSITORY) private readonly bulkOrderRepo: IBulkOrderRepository,
  ) {}

  public async execute(tenantId: string, params: {
    sourceType: string;
    sourceName: string;
    sourcePhone: string;
    productName: string;
    totalQuantity: number;
    unit: string;
    totalAmount: number;
    expectedDeliveryDate?: string;
  }): Promise<{ bulkOrderId: string; status: string }> {
    const bulkOrder = BulkOrder.create({
      tenantId: TenantId.create(tenantId),
      sourceType: params.sourceType,
      sourceName: params.sourceName,
      sourcePhone: params.sourcePhone,
      productName: params.productName,
      totalQuantity: params.totalQuantity,
      unit: params.unit,
      totalAmount: Money.create(params.totalAmount),
      expectedDeliveryDate: params.expectedDeliveryDate ? new Date(params.expectedDeliveryDate) : undefined,
    });

    await this.bulkOrderRepo.save(bulkOrder);

    return { bulkOrderId: bulkOrder.id.value, status: bulkOrder.status };
  }
}
