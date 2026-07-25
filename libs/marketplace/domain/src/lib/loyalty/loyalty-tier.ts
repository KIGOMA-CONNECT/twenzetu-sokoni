export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TierBenefits {
  readonly tier: LoyaltyTier;
  readonly minPoints: number;
  readonly pointsMultiplier: number;
  readonly freeDeliveryPerMonth: number;
  readonly zeroServiceFeeOnLaundry: boolean;
  readonly priorityDispatch: boolean;
  readonly exclusiveOffers: boolean;
}

export const TIER_BENEFITS: Record<LoyaltyTier, TierBenefits> = {
  BRONZE: {
    tier: 'BRONZE', minPoints: 0, pointsMultiplier: 1.0,
    freeDeliveryPerMonth: 0, zeroServiceFeeOnLaundry: false,
    priorityDispatch: false, exclusiveOffers: false,
  },
  SILVER: {
    tier: 'SILVER', minPoints: 100, pointsMultiplier: 1.2,
    freeDeliveryPerMonth: 2, zeroServiceFeeOnLaundry: false,
    priorityDispatch: false, exclusiveOffers: false,
  },
  GOLD: {
    tier: 'GOLD', minPoints: 500, pointsMultiplier: 1.5,
    freeDeliveryPerMonth: 5, zeroServiceFeeOnLaundry: false,
    priorityDispatch: true, exclusiveOffers: true,
  },
  PLATINUM: {
    tier: 'PLATINUM', minPoints: 1000, pointsMultiplier: 2.0,
    freeDeliveryPerMonth: 999, zeroServiceFeeOnLaundry: true,
    priorityDispatch: true, exclusiveOffers: true,
  },
};

export function calculateTier(totalPoints: number): LoyaltyTier {
  if (totalPoints >= TIER_BENEFITS.PLATINUM.minPoints) return 'PLATINUM';
  if (totalPoints >= TIER_BENEFITS.GOLD.minPoints) return 'GOLD';
  if (totalPoints >= TIER_BENEFITS.SILVER.minPoints) return 'SILVER';
  return 'BRONZE';
}
