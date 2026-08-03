import { ICommand } from '@abms/kernel';

export type SalaryRevisionReasonInput =
  | 'MERIT_INCREASE'
  | 'PROMOTION'
  | 'MARKET_ADJUSTMENT'
  | 'COST_OF_LIVING_ADJUSTMENT'
  | 'DEMOTION'
  | 'OTHER';

export interface RecordSalaryRevisionResult {
  readonly id: string;
}

export class RecordSalaryRevisionCommand implements ICommand<RecordSalaryRevisionResult> {
  public readonly _resultType?: RecordSalaryRevisionResult;

  public constructor(
    public readonly employeeId: string,
    public readonly reason: SalaryRevisionReasonInput,
    public readonly newBasicSalary: number,
    public readonly effectiveDate: string,
  ) {}
}
