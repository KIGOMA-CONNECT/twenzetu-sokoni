import { ICommand } from '@abms/kernel';

export class ApprovePayslipCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly payslipId: string) {}
}
