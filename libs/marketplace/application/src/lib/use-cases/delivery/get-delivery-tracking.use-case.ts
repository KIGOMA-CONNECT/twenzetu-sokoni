import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IDeliveryRepository, IOrderRepository } from '@afri-market/marketplace-domain';
import { DELIVERY_REPOSITORY, ORDER_REPOSITORY } from '../../tokens';

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin'];

export interface TrackingActor {
  userId: string;
  role?: string;
}

@Injectable()
export class GetDeliveryTrackingUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(orderId: string, actor?: TrackingActor): Promise<{
    deliveryId: string;
    status: string;
    driverId: string;
    pickupAddress: string;
    deliveryAddress: string;
    estimatedTimeMinutes: number | null;
    distanceKm: number | null;
    currentLatitude: number | null;
    currentLongitude: number | null;
    lastLocationUpdate: string | null;
  }> {
    const delivery = await this.deliveryRepo.findByOrderId(orderId);
    if (!delivery) {
      throw new NotFoundException(`No delivery found for order ${orderId}`);
    }

    const isAdmin = actor ? ADMIN_ROLES.includes(actor.role ?? '') : false;
    if (!actor || (!isAdmin && delivery.driverId.value !== actor.userId)) {
      const order = await this.orderRepo.findById(delivery.orderId);
      const isCustomer = !!order && order.customerId.value === actor?.userId;
      if (!isCustomer) {
        throw new ForbiddenException('You can only view tracking for your own orders');
      }
    }

    const distanceKm = delivery.distanceKm ?? null;
    // Derive an ETA when the driver never recorded one: assume ~25 km/h urban average.
    const estimatedTimeMinutes =
      delivery.estimatedTimeMinutes ??
      (distanceKm !== null && distanceKm > 0 ? Math.max(1, Math.round((distanceKm / 25) * 60)) : null);

    return {
      deliveryId: delivery.id.value,
      status: delivery.status,
      driverId: delivery.driverId.value,
      pickupAddress: delivery.pickupAddress,
      deliveryAddress: delivery.deliveryAddress,
      estimatedTimeMinutes,
      distanceKm,
      currentLatitude: delivery.currentLatitude ?? null,
      currentLongitude: delivery.currentLongitude ?? null,
      lastLocationUpdate: delivery.lastLocationUpdate ? delivery.lastLocationUpdate.toISOString() : null,
    };
  }
}
