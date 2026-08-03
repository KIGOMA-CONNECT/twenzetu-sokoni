export interface CostCenterProfileReadModel {
  readonly id: string;
  readonly orgUnitId: string;
  readonly budgetAmount: string;
  readonly budgetCurrency: string;
  readonly budgetPeriodStart: string;
  readonly budgetPeriodEnd: string;
  readonly glAccountCode: string | null;
  readonly version: number;
}
