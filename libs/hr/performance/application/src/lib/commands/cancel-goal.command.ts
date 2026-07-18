import { ICommand } from '@abms/kernel';

export class CancelGoalCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly goalId: string) {}
}
