import { ICommand } from '@abms/kernel';

export interface EnrollInBenefitResult {
  readonly id: string;
}

export class EnrollInBenefitCommand implements ICommand<EnrollInBenefitResult> {
  public readonly _resultType?: EnrollInBenefitResult;

  public constructor(
    public readonly employeeId: string,
    public readonly benefitPlanId: string,
    public readonly effectiveDate: string,
  ) {}
}
