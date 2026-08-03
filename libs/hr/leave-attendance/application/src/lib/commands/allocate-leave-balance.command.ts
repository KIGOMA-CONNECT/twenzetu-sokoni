import { ICommand } from '@abms/kernel';

export interface AllocateLeaveBalanceResult {
  readonly id: string;
}

export class AllocateLeaveBalanceCommand implements ICommand<AllocateLeaveBalanceResult> {
  public readonly _resultType?: AllocateLeaveBalanceResult;

  public constructor(
    public readonly employeeId: string,
    public readonly leaveTypeId: string,
    public readonly year: number,
    public readonly allocatedDays: number,
  ) {}
}
