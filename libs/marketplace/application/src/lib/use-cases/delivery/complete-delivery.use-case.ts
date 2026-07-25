import { Inject, Injectable, Optional } from '@nestjs/common';
import { EntityId, Money } from '@afri-market/kernel';
import {
  Delivery,
  CustomerPoints,
  IOrderRepository,
  ICustomerPointsRepository,
} from '@afri-market/marketplace-domain';
import {
  ORDER_REPOSITORY,
  DELIVERY_REPOSITORY,
  CUSTOMER_POINTS_REPOSITORY,
  MARKETPLACE_GATEWAY,
} from '../../tokens';
import { IDeliveryRepository } from './create-delivery.use-case';

export interface ICompleteDeliveryRepository extends IDeliveryRepository {
  findByOrderId(orderId: string): Promise<Delivery | null>;
  save(delivery: Delivery): Promise<void>;
}

@Injectable()
export class CompleteDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: ICompleteDeliveryRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(CUSTOMER_POINTS_REPOSITORY) private readonly pointsRepo: ICustomerPointsRepository,
    @Optional() @Inject(MARKETPLACE_GATEWAY) private readonly gateway: { notifyDeliveryStatusChanged(orderId: string, driverId: string, delivery: Record<string, unknown>): void } | undefined,
  ) {}

  public async execute(tenantId: string, params: {
    deliveryId: string;
    driverEarnings: number;
  }): Promise<{
    deliveryId: string;
    orderId: string;
    status: string;
    driverEarnings: number;
    loyaltyPointsEarned: number;
  }> {
    const delivery = await this.deliveryRepo.findById(EntityId.from(params.deliveryId));
    if (!delivery) throw new Error('Delivery not found');

    const order = await this.orderRepo.findById(delivery.orderId);
    if (!order) throw new Error('Order not found');

    const driverEarnings = Money.create(params.driverEarnings);
    delivery.complete(driverEarnings);
    await this.deliveryRepo.save(delivery);

    order.deliver();
    await this.orderRepo.save(order);

    const pointsEarned = Math.floor(order.totalAmount.amount / 100);
    let points = await this.pointsRepo.findByCustomerId(order.customerId.value);
    if (!points) {
      points = CustomerPoints.create({
        tenantId: delivery.tenantId,
        customerId: order.customerId,
      });
    }
    points.earnPoints(pointsEarned, `Order ${order.id.value} delivered`);
    await this.pointsRepo.save(points);

    this.gateway?.notifyDeliveryStatusChanged(order.id.value, delivery.driverId.value, {
      deliveryId: delivery.id.value,
      status: 'DELIVERED',
      orderId: order.id.value,
    });

    return {
      deliveryId: delivery.id.value,
      orderId: order.id.value,
      status: 'DELIVERED',
      driverEarnings: driverEarnings.amount,
      loyaltyPointsEarned: pointsEarned,
    };
  }
}
