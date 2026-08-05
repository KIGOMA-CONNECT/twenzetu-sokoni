import { Injectable, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IOrderRepository } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY } from '../../tokens';
import { UpdateOrderStatusCommand } from '../../commands/update-order-status.command';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin'];

export interface UpdateOrderStatusActor {
  role: string;
  vendorId?: string;
}

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: UpdateOrderStatusCommand,
    actor?: UpdateOrderStatusActor,
  ): Promise<{ orderId: string; status: string }> {
    const order = await this.orderRepo.findByIdAndTenant(
      command.orderId,
      tenantId,
    );
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const isAdmin = actor ? ADMIN_ROLES.includes(actor.role) : false;
    if (!actor || (!isAdmin && (!actor.vendorId || actor.vendorId !== order.vendorId.value))) {
      throw new BadRequestException('You can only update orders assigned to your shop');
    }

    const allowedTransitions = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowedTransitions.includes(command.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${command.status}`,
      );
    }

    switch (command.status) {
      case 'CONFIRMED':
        order.confirm();
        break;
      case 'PREPARING':
        order.startPreparing();
        break;
      case 'READY_FOR_PICKUP':
        order.markReady();
        break;
      case 'OUT_FOR_DELIVERY':
        order.startDelivery();
        break;
      case 'DELIVERED':
        order.deliver();
        break;
      case 'CANCELLED':
        order.cancel();
        break;
      default:
        throw new BadRequestException(`Unknown status: ${command.status}`);
    }

    await this.orderRepo.save(order);

    return { orderId: order.id.value, status: order.status };
  }
}
