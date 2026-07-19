import { IsIn, IsInt, IsString, Max, Min, MinLength } from 'class-validator';

const BENEFIT_TYPES = ['HEALTH_INSURANCE', 'PENSION', 'LIFE_INSURANCE', 'DISABILITY_INSURANCE', 'OTHER'] as const;

export class CreateBenefitPlanDto {
  @IsString()
  @MinLength(1)
  public name!: string;

  @IsIn(BENEFIT_TYPES)
  public benefitType!: (typeof BENEFIT_TYPES)[number];

  @IsInt()
  @Min(0)
  @Max(10_000)
  public employerContributionRateBasisPoints!: number;
}
