import { ICommand } from '@abms/kernel';

export interface RecordManualAttendanceResult {
  readonly id: string;
}

export class RecordManualAttendanceCommand implements ICommand<RecordManualAttendanceResult> {
  public readonly _resultType?: RecordManualAttendanceResult;

  public constructor(
    public readonly employeeId: string,
    public readonly date: string,
    public readonly status: 'ABSENT' | 'LATE' | 'HALF_DAY',
  ) {}
}
