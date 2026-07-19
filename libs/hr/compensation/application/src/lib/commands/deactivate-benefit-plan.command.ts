import { ICommand } from '@abms/kernel';

export class DeactivateBenefitPlanCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly benefitPlanId: string) {}
}
