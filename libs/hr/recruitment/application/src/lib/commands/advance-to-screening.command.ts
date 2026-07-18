import { ICommand } from '@abms/kernel';

export class AdvanceToScreeningCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly applicationId: string) {}
}
