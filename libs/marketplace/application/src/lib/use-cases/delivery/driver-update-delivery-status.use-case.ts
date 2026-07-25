import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Money } from '@afri-market/kernel';
import { IDeliveryRepository } from '@afri-market/marketplace-domain';
import { DELIVERY_REPOSITORY } from '../../tokens';

const DELIVERY_VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ASSIGNED', 'FAILED'],
  ASSIGNED: ['PICKED_UP', 'FAILED'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
};

@Injectable()
export class DriverUpdateDeliveryStatusUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
  ) {}

  public async execute(
    tenantId: string,
    deliveryId: string,
    driverId: string,
    newStatus: string,
    driverEarnings?: number,
  ): Promise<{ deliveryId: string; status: string }> {
    const delivery = await this.deliveryRepo.findByIdAndTenant(deliveryId, tenantId);
    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }
    if (delivery.driverId.value !== driverId) {
      throw new BadRequestException('You can only update deliveries assigned to you');
    }
    const allowed = DELIVERY_VALID_TRANSITIONS[delivery.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${delivery.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    if (newStatus === 'DELIVERED' && driverEarnings !== undefined) {
      delivery.complete(Money.create(driverEarnings));
    } else if (newStatus === 'ASSIGNED') {
      delivery.assign();
    } else if (newStatus === 'PICKED_UP') {
      delivery.pickup();
    } else if (newStatus === 'IN_TRANSIT') {
      delivery.startTransit();
    } else if (newStatus === 'FAILED') {
      delivery.fail();
    }

    await this.deliveryRepo.save(delivery);

    return { deliveryId: delivery.id.value, status: delivery.status };
  }
}
