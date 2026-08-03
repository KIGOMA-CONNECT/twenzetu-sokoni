import { ICommand } from '@abms/kernel';

export interface GeneratePayslipResult {
  readonly id: string;
}

export class GeneratePayslipCommand implements ICommand<GeneratePayslipResult> {
  public readonly _resultType?: GeneratePayslipResult;

  public constructor(
    public readonly payrollPeriodId: string,
    public readonly employeeId: string,
  ) {}
}
