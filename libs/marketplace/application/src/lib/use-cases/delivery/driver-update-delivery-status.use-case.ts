import { Injectable, NotFoundException, BadRequestException, Inject, Optional } from '@nestjs/common';
import { IDeliveryRepository, IOrderRepository, OrderStatus } from '@afri-market/marketplace-domain';
import { DELIVERY_REPOSITORY, ORDER_REPOSITORY, MARKETPLACE_GATEWAY } from '../../tokens';

const DELIVERY_VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ASSIGNED', 'FAILED'],
  ASSIGNED: ['PICKED_UP', 'FAILED'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
};

const DELIVERY_TO_ORDER_STATUS: Record<string, OrderStatus> = {
  ASSIGNED: 'OUT_FOR_DELIVERY',
  PICKED_UP: 'OUT_FOR_DELIVERY',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'PLACED',
};

@Injectable()
export class DriverUpdateDeliveryStatusUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
    @Optional() @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository | undefined,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: {
      notifyOrderUpdate(orderId: string, update: Record<string, unknown>): void;
    } | undefined,
  ) {}

  public async execute(
    tenantId: string,
    deliveryId: string,
    driverId: string,
    newStatus: string,
  ): Promise<{ deliveryId: string; orderId: string; status: string }> {
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

    if (newStatus === 'DELIVERED') {
      delivery.complete(delivery.driverEarnings);
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

    const orderId = delivery.orderId.value;

    if (this.orderRepo) {
      const order = await this.orderRepo.findById(delivery.orderId);
      if (order) {
        const orderStatus = DELIVERY_TO_ORDER_STATUS[newStatus];
        if (orderStatus) {
          order.updateStatus(orderStatus);
          await this.orderRepo.save(order);
        }
      }
    }

    if (this.gateway) {
      this.gateway.notifyOrderUpdate(orderId, {
        deliveryId,
        deliveryStatus: delivery.status,
        orderStatus: DELIVERY_TO_ORDER_STATUS[newStatus],
        driverId,
        timestamp: new Date().toISOString(),
      });
    }

    return { deliveryId: delivery.id.value, orderId, status: delivery.status };
  }
}
