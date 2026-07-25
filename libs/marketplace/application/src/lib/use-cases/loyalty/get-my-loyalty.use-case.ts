import { Injectable, Inject } from '@nestjs/common';
import { ICustomerPointsRepository } from '@afri-market/marketplace-domain';
import { CUSTOMER_POINTS_REPOSITORY } from '../../tokens';

@Injectable()
export class GetMyLoyaltyUseCase {
  constructor(
    @Inject(CUSTOMER_POINTS_REPOSITORY) private readonly pointsRepo: ICustomerPointsRepository,
  ) {}

  public async getPoints(customerId: string): Promise<{ totalPoints: number; redeemablePoints: number; tier: string }> {
    const points = await this.pointsRepo.findByCustomerId(customerId);
    if (!points) {
      return { totalPoints: 0, redeemablePoints: 0, tier: 'BRONZE' };
    }
    return {
      totalPoints: points.totalPoints,
      redeemablePoints: points.redeemablePoints,
      tier: points.tier,
    };
  }

  public async getTier(customerId: string): Promise<{ tier: string; lifetimePoints: number }> {
    const points = await this.pointsRepo.findByCustomerId(customerId);
    if (!points) {
      return { tier: 'BRONZE', lifetimePoints: 0 };
    }
    return { tier: points.tier, lifetimePoints: points.lifetimePoints };
  }
}
