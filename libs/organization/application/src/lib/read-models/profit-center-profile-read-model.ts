export interface ProfitCenterProfileReadModel {
  readonly id: string;
  readonly orgUnitId: string;
  readonly revenueTargetAmount: string;
  readonly revenueTargetCurrency: string;
  readonly reportingCurrency: string;
  readonly glAccountCode: string | null;
  readonly version: number;
}
