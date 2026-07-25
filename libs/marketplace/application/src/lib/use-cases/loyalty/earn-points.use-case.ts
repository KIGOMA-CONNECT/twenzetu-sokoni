import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { CustomerPoints, ICustomerPointsRepository } from '@afri-market/marketplace-domain';
import { CUSTOMER_POINTS_REPOSITORY } from '../../tokens';

@Injectable()
export class EarnPointsUseCase {
  constructor(
    @Inject(CUSTOMER_POINTS_REPOSITORY) private readonly pointsRepo: ICustomerPointsRepository,
  ) {}

  public async execute(tenantId: string, params: {
    customerId: string; orderId: string; orderTotal: number;
  }): Promise<{ pointsEarned: number; newTotal: number; tier: string }> {
    const pointsEarned = Math.floor(params.orderTotal / 100);
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
