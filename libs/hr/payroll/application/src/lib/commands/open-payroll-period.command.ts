import { ICommand } from '@abms/kernel';

export interface OpenPayrollPeriodResult {
  readonly id: string;
}

export class OpenPayrollPeriodCommand implements ICommand<OpenPayrollPeriodResult> {
  public readonly _resultType?: OpenPayrollPeriodResult;

  public constructor(
    public readonly year: number,
    public readonly month: number,
  ) {}
}
