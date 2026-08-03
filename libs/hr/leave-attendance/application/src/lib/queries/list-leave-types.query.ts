import { IQuery } from '@abms/kernel';
import { LeaveTypeReadModel } from '../read-models/leave-type-read-model';

export class ListLeaveTypesQuery implements IQuery<LeaveTypeReadModel[]> {
  public readonly _resultType?: LeaveTypeReadModel[];
}
