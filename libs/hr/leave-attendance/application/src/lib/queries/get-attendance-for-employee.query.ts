import { IQuery } from '@abms/kernel';
import { AttendanceRecordReadModel } from '../read-models/attendance-record-read-model';

export class GetAttendanceForEmployeeQuery implements IQuery<AttendanceRecordReadModel[]> {
  public readonly _resultType?: AttendanceRecordReadModel[];

  public constructor(
    public readonly employeeId: string,
    public readonly startDate: string,
    public readonly endDate: string,
  ) {}
}
