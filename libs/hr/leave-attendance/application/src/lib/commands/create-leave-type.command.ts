import { ICommand } from '@abms/kernel';

export interface CreateLeaveTypeResult {
  readonly id: string;
}

export class CreateLeaveTypeCommand implements ICommand<CreateLeaveTypeResult> {
  public readonly _resultType?: CreateLeaveTypeResult;

  public constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly defaultDaysPerYear: number,
    public readonly requiresApproval: boolean,
  ) {}
}
