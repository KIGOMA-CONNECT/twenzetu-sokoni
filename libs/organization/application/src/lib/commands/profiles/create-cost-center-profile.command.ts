import { ICommand } from '@abms/kernel';

export interface CreateCostCenterProfileResult {
  readonly id: string;
}

export class CreateCostCenterProfileCommand implements ICommand<CreateCostCenterProfileResult> {
  public readonly _resultType?: CreateCostCenterProfileResult;

  public constructor(
    public readonly orgUnitId: string,
    public readonly budgetAmount: string,
    public readonly budgetCurrency: string,
    public readonly budgetPeriodStart: string,
    public readonly budgetPeriodEnd: string,
    public readonly glAccountCode: string | null,
  ) {}
}
