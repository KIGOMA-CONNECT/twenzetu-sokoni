import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IDeliveryRepository } from '@afri-market/marketplace-domain';
import { DELIVERY_REPOSITORY } from '../../tokens';

@Injectable()
export class UpdateDriverLocationUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
  ) {}

  public async execute(
    tenantId: string,
    deliveryId: string,
    driverId: string,
    latitude: number,
    longitude: number,
  ): Promise<{ deliveryId: string; latitude: number; longitude: number; lastLocationUpdate: Date }> {
    const delivery = await this.deliveryRepo.findByIdAndTenant(deliveryId, tenantId);
    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }
    if (delivery.driverId.value !== driverId) {
      throw new BadRequestException('You can only update location for your own deliveries');
    }
    if (delivery.status !== 'IN_TRANSIT' && delivery.status !== 'PICKED_UP') {
      throw new BadRequestException('Can only update location for in-transit or picked-up deliveries');
    }

    delivery.updateLocation(latitude, longitude);
    await this.deliveryRepo.save(delivery);

    return {
      deliveryId: delivery.id.value,
      latitude,
      longitude,
      lastLocationUpdate: delivery.lastLocationUpdate!,
    };
  }
}
