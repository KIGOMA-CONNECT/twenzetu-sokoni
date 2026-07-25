import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IBulkOrderRepository } from '@afri-market/marketplace-domain';
import { BULK_ORDER_REPOSITORY } from '../../tokens';

@Injectable()
export class JoinBulkOrderUseCase {
  constructor(
    @Inject(BULK_ORDER_REPOSITORY) private readonly bulkOrderRepo: IBulkOrderRepository,
  ) {}

  public async execute(params: {
    bulkOrderId: string;
    vendorId: string;
  }): Promise<{ bulkOrderId: string; participantCount: number; status: string }> {
    const bulkOrder = await this.bulkOrderRepo.findById(EntityId.from(params.bulkOrderId));
    if (!bulkOrder) throw new NotFoundException('Bulk order not found');

    bulkOrder.addParticipant(params.vendorId);
    await this.bulkOrderRepo.save(bulkOrder);

    return {
      bulkOrderId: bulkOrder.id.value,
      participantCount: bulkOrder.participantVendorIds.length,
      status: bulkOrder.status,
    };
  }
}
