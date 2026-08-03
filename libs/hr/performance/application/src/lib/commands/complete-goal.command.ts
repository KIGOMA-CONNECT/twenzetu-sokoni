import { ICommand } from '@abms/kernel';

export class CompleteGoalCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly goalId: string) {}
}
