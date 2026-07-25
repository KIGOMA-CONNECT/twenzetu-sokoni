import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICustomerPointsRepository } from '@afri-market/marketplace-domain';
import { CUSTOMER_POINTS_REPOSITORY } from '../../tokens';

@Injectable()
export class RedeemPointsUseCase {
  constructor(
    @Inject(CUSTOMER_POINTS_REPOSITORY) private readonly pointsRepo: ICustomerPointsRepository,
  ) {}

  public async execute(params: {
    customerId: string;
    pointsToRedeem: number;
  }): Promise<{
    redeemedPoints: number;
    rewardType: 'FREE_DELIVERY' | 'DISCOUNT';
    discountPercentage: number;
    freeDelivery: boolean;
    remainingRedeemable: number;
  }> {
    const points = await this.pointsRepo.findByCustomerId(params.customerId);
    if (!points) throw new NotFoundException('Customer loyalty profile not found');

    if (params.pointsToRedeem > points.redeemablePoints) {
      throw new BadRequestException(
        `Insufficient redeemable points. Available: ${points.redeemablePoints}`,
      );
    }

    points.redeemPoints(params.pointsToRedeem);
    await this.pointsRepo.save(points);

    const freeDelivery = points.freeDeliveriesRemaining > 0;

    return {
      redeemedPoints: params.pointsToRedeem,
      rewardType: freeDelivery ? 'FREE_DELIVERY' : 'DISCOUNT',
      discountPercentage: points.tier === 'GOLD' ? 5 : points.tier === 'PLATINUM' ? 10 : 0,
      freeDelivery,
      remainingRedeemable: points.redeemablePoints,
    };
  }
}
