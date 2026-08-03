import { ICommand } from '@abms/kernel';

export interface ClockInResult {
  readonly id: string;
}

export class ClockInCommand implements ICommand<ClockInResult> {
  public readonly _resultType?: ClockInResult;

  public constructor(public readonly employeeId: string) {}
}
