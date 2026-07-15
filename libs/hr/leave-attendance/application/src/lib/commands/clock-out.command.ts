import { ICommand } from '@abms/kernel';

export class ClockOutCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly attendanceRecordId: string) {}
}
