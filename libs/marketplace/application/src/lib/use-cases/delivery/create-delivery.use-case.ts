import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import {
  Delivery,
  IOrderRepository,
  VehicleType,
} from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY, DELIVERY_REPOSITORY } from '../../tokens';
import { CreateDeliveryCommand } from '../../commands/create-delivery.command';

export interface IDeliveryRepository {
  findById(id: EntityId): Promise<Delivery | null>;
  save(delivery: Delivery): Promise<void>;
  findByOrderId(orderId: string): Promise<Delivery | null>;
  findByDriverId(driverId: string): Promise<Delivery[]>;
}

export interface CreateDeliveryActor {
  userId: string;
  role: string;
  vendorId?: string;
}

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin'];

@Injectable()
export class CreateDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepo: IDeliveryRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: CreateDeliveryCommand,
    actor?: CreateDeliveryActor,
  ): Promise<{ deliveryId: string }> {
    const order = await this.orderRepo.findById(
      EntityId.from(command.orderId),
    );
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status !== 'READY_FOR_PICKUP') {
      throw new Error('Order is not ready for pickup');
    }

    if (actor) {
      const isAdmin = ADMIN_ROLES.includes(actor.role ?? '');
      const isOrderVendor = actor.vendorId != null && order.vendorId.value === actor.vendorId;
      if (!isAdmin && !isOrderVendor) {
        throw new ForbiddenException('Only the order vendor or an admin can create a delivery assignment');
      }
    }

    const existing = await this.deliveryRepo.findByOrderId(command.orderId);
    if (existing) {
      throw new Error('Delivery already exists for this order');
    }

    const delivery = Delivery.create({
      tenantId: TenantId.create(tenantId),
      orderId: EntityId.from(command.orderId),
      driverId: EntityId.from(command.driverId),
      vehicleType: command.vehicleType as VehicleType,
      pickupAddress: command.pickupAddress,
      deliveryAddress: command.deliveryAddress,
      pickupLatitude: command.pickupLatitude,
      pickupLongitude: command.pickupLongitude,
      deliveryLatitude: command.deliveryLatitude,
      deliveryLongitude: command.deliveryLongitude,
    });

    await this.deliveryRepo.save(delivery);

    return { deliveryId: delivery.id.value };
  }
}
