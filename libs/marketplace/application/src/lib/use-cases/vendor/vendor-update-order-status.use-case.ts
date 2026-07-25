import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IOrderRepository, OrderStatus } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY } from '../../tokens';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class VendorUpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(
    tenantId: string,
    orderId: string,
    vendorId: string,
    newStatus: string,
  ): Promise<{ orderId: string; status: string }> {
    const order = await this.orderRepo.findByIdAndTenant(orderId, tenantId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.vendorId.value !== vendorId) {
      throw new BadRequestException('You can only update orders assigned to your shop');
    }
    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    order.updateStatus(newStatus as OrderStatus);
    await this.orderRepo.save(order);

    return { orderId: order.id.value, status: order.status };
  }
}
