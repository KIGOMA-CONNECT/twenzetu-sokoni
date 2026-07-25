import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IOrderRepository } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY } from '../../tokens';

const CANCELLABLE_STATUSES = ['PLACED', 'CONFIRMED'];

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(
    tenantId: string,
    orderId: string,
    customerId: string,
    reason?: string,
  ): Promise<{ orderId: string; status: string }> {
    const order = await this.orderRepo.findByIdAndTenant(orderId, tenantId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.customerId.value !== customerId) {
      throw new BadRequestException('You can only cancel your own orders');
    }
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Order in status ${order.status} cannot be cancelled. Only PLACED or CONFIRMED orders can be cancelled.`,
      );
    }

    order.cancel(reason);
    await this.orderRepo.save(order);

    return { orderId: order.id.value, status: order.status };
  }
}
