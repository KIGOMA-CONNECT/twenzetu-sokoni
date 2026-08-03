import { ICommand } from '@abms/kernel';

export interface SubmitLeaveRequestResult {
  readonly id: string;
}

export class SubmitLeaveRequestCommand implements ICommand<SubmitLeaveRequestResult> {
  public readonly _resultType?: SubmitLeaveRequestResult;

  public constructor(
    public readonly employeeId: string,
    public readonly leaveTypeId: string,
    public readonly startDate: string,
    public readonly endDate: string,
    public readonly numberOfDays: number,
    public readonly reason?: string | null,
  ) {}
}
