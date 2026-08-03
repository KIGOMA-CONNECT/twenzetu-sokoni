import { ICommand } from '@abms/kernel';

export class AdvanceToInterviewingCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly applicationId: string) {}
}
