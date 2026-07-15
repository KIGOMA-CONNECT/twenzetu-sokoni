import { ICommand } from '@abms/kernel';

export class ApproveLeaveRequestCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly leaveRequestId: string,
    public readonly comment?: string | null,
  ) {}
}
