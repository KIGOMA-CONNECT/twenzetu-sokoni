import { IQuery } from '@abms/kernel';
import { GoalReadModel } from '../read-models/goal-read-model';

export class ListGoalsForEmployeeQuery implements IQuery<GoalReadModel[]> {
  public readonly _resultType?: GoalReadModel[];

  public constructor(public readonly employeeId: string) {}
}
