import { ICommand } from '@abms/kernel';

export class UpdateGoalProgressCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly goalId: string,
    public readonly progressPercent: number,
  ) {}
}
