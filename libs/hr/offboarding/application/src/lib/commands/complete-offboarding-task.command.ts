import { ICommand } from '@abms/kernel';

export class CompleteOffboardingTaskCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly offboardingTaskId: string) {}
}
