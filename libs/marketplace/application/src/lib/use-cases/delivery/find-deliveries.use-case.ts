import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { Delivery, IDeliveryRepository } from '@afri-market/marketplace-domain';
import { DELIVERY_REPOSITORY } from '../../tokens';

@Injectable()
export class FindDeliveriesUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
  ) {}

  public async findByDriver(
    tenantId: string,
    driverId: string,
    opts: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: Delivery[]; total: number }> {
    return this.deliveryRepo.findByTenantAndDriver(tenantId, driverId, opts);
  }

  public async findByOrder(orderId: string): Promise<Delivery | null> {
    return this.deliveryRepo.findByOrderId(orderId);
  }

  public async findById(deliveryId: string): Promise<Delivery | null> {
    return this.deliveryRepo.findById(EntityId.from(deliveryId));
  }
}
