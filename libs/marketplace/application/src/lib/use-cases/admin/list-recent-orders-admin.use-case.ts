import { Injectable, Inject } from '@nestjs/common';
import { IOrderRepository } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY } from '../../tokens';

@Injectable()
export class ListRecentOrdersAdminUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(tenantId: string, limit: number = 20) {
    const orders = await this.orderRepo.findRecentByTenant(tenantId, limit);
    return {
      data: orders.map(o => ({
        id: o.id.value,
        customerId: o.customerId.value,
        vendorId: o.vendorId.value,
        status: o.status,
        totalAmount: o.totalAmount.amount,
        currency: o.totalAmount.currency,
        deliveryAddress: o.deliveryAddress,
        createdAt: o.createdAt,
      })),
    };
  }
}
