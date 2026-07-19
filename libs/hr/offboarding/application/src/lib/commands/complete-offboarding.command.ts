import { ICommand } from '@abms/kernel';

export class CompleteOffboardingCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly offboardingCaseId: string) {}
}
