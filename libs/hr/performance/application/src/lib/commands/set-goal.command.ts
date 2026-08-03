import { ICommand } from '@abms/kernel';

export interface SetGoalResult {
  readonly id: string;
}

export class SetGoalCommand implements ICommand<SetGoalResult> {
  public readonly _resultType?: SetGoalResult;

  public constructor(
    public readonly employeeId: string,
    public readonly title: string,
    public readonly targetDate: string,
    public readonly description?: string | null,
  ) {}
}
