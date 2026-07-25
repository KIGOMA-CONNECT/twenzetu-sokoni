import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Delivery, IDeliveryRepository } from '@afri-market/marketplace-domain';
import { DELIVERY_REPOSITORY } from '../../tokens';

@Injectable()
export class GetDriverDeliveriesUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
  ) {}

  public async execute(
    tenantId: string,
    driverId: string,
    opts: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: Delivery[]; total: number }> {
    return this.deliveryRepo.findByTenantAndDriver(tenantId, driverId, opts);
  }
}
