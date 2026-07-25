import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IDeliveryRepository } from '@afri-market/marketplace-domain';
import { DELIVERY_REPOSITORY } from '../../tokens';

@Injectable()
export class GetDeliveryTrackingUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
  ) {}

  public async execute(orderId: string): Promise<{
    deliveryId: string;
    status: string;
    driverId: string;
    pickupAddress: string;
    deliveryAddress: string;
    estimatedTimeMinutes: number | null;
    distanceKm: number | null;
  }> {
    const delivery = await this.deliveryRepo.findByOrderId(orderId);
    if (!delivery) {
      throw new NotFoundException(`No delivery found for order ${orderId}`);
    }

    return {
      deliveryId: delivery.id.value,
      status: delivery.status,
      driverId: delivery.driverId.value,
      pickupAddress: delivery.pickupAddress,
      deliveryAddress: delivery.deliveryAddress,
      estimatedTimeMinutes: delivery.estimatedTimeMinutes ?? null,
      distanceKm: delivery.distanceKm ?? null,
    };
  }
}
