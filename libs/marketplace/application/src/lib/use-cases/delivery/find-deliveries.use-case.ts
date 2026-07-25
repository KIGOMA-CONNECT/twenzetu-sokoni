import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { Delivery } from '@afri-market/marketplace-domain';
import { DELIVERY_REPOSITORY } from '../../tokens';
import { IDeliveryRepository } from './create-delivery.use-case';

@Injectable()
export class FindDeliveriesUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
  ) {}

  public async findByDriver(driverId: string): Promise<Delivery[]> {
    return this.deliveryRepo.findByDriverId(driverId);
  }

  public async findByOrder(orderId: string): Promise<Delivery | null> {
    return this.deliveryRepo.findByOrderId(orderId);
  }

  public async findById(deliveryId: string): Promise<Delivery | null> {
    return this.deliveryRepo.findById(EntityId.from(deliveryId));
  }
}
