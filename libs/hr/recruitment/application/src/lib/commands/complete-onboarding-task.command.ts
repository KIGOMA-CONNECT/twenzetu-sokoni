import { ICommand } from '@abms/kernel';

export class CompleteOnboardingTaskCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly onboardingTaskId: string) {}
}
