export interface BenefitPlanReadModel {
  readonly id: string;
  readonly name: string;
  readonly benefitType: string;
  readonly employerContributionRateBasisPoints: number;
  readonly isActive: boolean;
}
