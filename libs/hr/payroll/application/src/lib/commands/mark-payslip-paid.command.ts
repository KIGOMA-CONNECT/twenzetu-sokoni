import { ICommand } from '@abms/kernel';

export class MarkPayslipPaidCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly payslipId: string) {}
}
