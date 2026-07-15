import { IQuery } from '@abms/kernel';
import { LeaveRequestReadModel } from '../read-models/leave-request-read-model';

export class ListLeaveRequestsForEmployeeQuery implements IQuery<LeaveRequestReadModel[]> {
  public readonly _resultType?: LeaveRequestReadModel[];

  public constructor(public readonly employeeId: string) {}
}
