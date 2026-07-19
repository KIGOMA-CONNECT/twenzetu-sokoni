import { ICommand } from '@abms/kernel';

export type BenefitTypeInput = 'HEALTH_INSURANCE' | 'PENSION' | 'LIFE_INSURANCE' | 'DISABILITY_INSURANCE' | 'OTHER';

export interface CreateBenefitPlanResult {
  readonly id: string;
}

export class CreateBenefitPlanCommand implements ICommand<CreateBenefitPlanResult> {
  public readonly _resultType?: CreateBenefitPlanResult;

  public constructor(
    public readonly name: string,
    public readonly benefitType: BenefitTypeInput,
    public readonly employerContributionRateBasisPoints: number,
  ) {}
}
