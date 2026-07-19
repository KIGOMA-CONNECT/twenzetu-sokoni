import { IQuery } from '@abms/kernel';
import { OffboardingTaskReadModel } from '../read-models/offboarding-task-read-model';

export class ListOffboardingTasksForCaseQuery implements IQuery<OffboardingTaskReadModel[]> {
  public readonly _resultType?: OffboardingTaskReadModel[];

  public constructor(public readonly offboardingCaseId: string) {}
}
