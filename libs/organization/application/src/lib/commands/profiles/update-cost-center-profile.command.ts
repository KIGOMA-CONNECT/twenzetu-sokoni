import { ICommand } from '@abms/kernel';

export class UpdateCostCenterProfileCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly orgUnitId: string,
    public readonly budgetAmount: string,
    public readonly budgetCurrency: string,
    public readonly budgetPeriodStart: string,
    public readonly budgetPeriodEnd: string,
    public readonly glAccountCode: string | null,
    public readonly expectedVersion: number,
  ) {}
}
