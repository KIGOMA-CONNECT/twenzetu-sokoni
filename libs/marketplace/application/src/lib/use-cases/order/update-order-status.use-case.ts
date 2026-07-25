import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Guard } from '@afri-market/kernel';
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

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: UpdateOrderStatusCommand,
  ): Promise<{ orderId: string; status: string }> {
    const order = await this.orderRepo.findById(
      EntityId.from(command.orderId),
    );
    if (!order) {
      throw new Error('Order not found');
    }

    const allowedTransitions = VALID_TRANSITIONS[order.status] ?? [];
    Guard.assert(
      allowedTransitions.includes(command.status),
      `Cannot transition from ${order.status} to ${command.status}`,
    );

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
        throw new Error(`Unknown status: ${command.status}`);
    }

    await this.orderRepo.save(order);

    return { orderId: order.id.value, status: order.status };
  }
}
