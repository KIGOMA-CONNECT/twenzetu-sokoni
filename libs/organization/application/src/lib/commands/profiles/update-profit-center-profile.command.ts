import { ICommand } from '@abms/kernel';

export class UpdateProfitCenterProfileCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly orgUnitId: string,
    public readonly revenueTargetAmount: string,
    public readonly revenueTargetCurrency: string,
    public readonly reportingCurrency: string,
    public readonly glAccountCode: string | null,
    public readonly expectedVersion: number,
  ) {}
}
