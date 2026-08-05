import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { CustomerPoints, ICustomerPointsRepository, IOrderRepository } from '@afri-market/marketplace-domain';
import { CUSTOMER_POINTS_REPOSITORY, ORDER_REPOSITORY } from '../../tokens';

@Injectable()
export class EarnPointsUseCase {
  constructor(
    @Inject(CUSTOMER_POINTS_REPOSITORY) private readonly pointsRepo: ICustomerPointsRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async execute(tenantId: string, params: {
    customerId: string; orderId: string; orderTotal: number;
  }): Promise<{ pointsEarned: number; newTotal: number; tier: string }> {
    const order = await this.orderRepo.findById(EntityId.from(params.orderId));
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (order.customerId.value !== params.customerId) {
      throw new ForbiddenException('You can only earn points for your own orders');
    }

    const pointsEarned = Math.floor(order.totalAmount.amount / 100);
    let points = await this.pointsRepo.findByCustomerId(params.customerId);

    if (!points) {
      points = CustomerPoints.create({
        tenantId: TenantId.create(tenantId),
        customerId: EntityId.from(params.customerId),
      });
    }

    points.earnPoints(pointsEarned, `Order ${params.orderId}`);
    await this.pointsRepo.save(points);

    return { pointsEarned, newTotal: points.totalPoints, tier: points.tier };
  }
}
