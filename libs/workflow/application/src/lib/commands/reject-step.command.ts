import { ICommand } from '@abms/kernel';

export class RejectStepCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly workflowInstanceId: string,
    public readonly stepOrder: number,
    public readonly approverUserId: string,
    public readonly approverRole: string,
    public readonly comment: string | null,
  ) {}
}
