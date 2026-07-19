import { ICommand } from '@abms/kernel';

export class CancelOffboardingCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly offboardingCaseId: string) {}
}
