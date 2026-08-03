import { ICommand } from '@abms/kernel';

export interface CreateProfitCenterProfileResult {
  readonly id: string;
}

export class CreateProfitCenterProfileCommand implements ICommand<CreateProfitCenterProfileResult> {
  public readonly _resultType?: CreateProfitCenterProfileResult;

  public constructor(
    public readonly orgUnitId: string,
    public readonly revenueTargetAmount: string,
    public readonly revenueTargetCurrency: string,
    public readonly reportingCurrency: string,
    public readonly glAccountCode: string | null,
  ) {}
}
