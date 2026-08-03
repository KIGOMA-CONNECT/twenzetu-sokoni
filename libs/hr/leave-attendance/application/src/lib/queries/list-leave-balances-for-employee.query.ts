import { IQuery } from '@abms/kernel';
import { LeaveBalanceReadModel } from '../read-models/leave-balance-read-model';

export class ListLeaveBalancesForEmployeeQuery implements IQuery<LeaveBalanceReadModel[]> {
  public readonly _resultType?: LeaveBalanceReadModel[];

  public constructor(
    public readonly employeeId: string,
    public readonly year: number,
  ) {}
}
