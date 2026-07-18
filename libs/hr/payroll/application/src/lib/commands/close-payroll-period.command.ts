import { ICommand } from '@abms/kernel';

export class ClosePayrollPeriodCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly payrollPeriodId: string) {}
}
