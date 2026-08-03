import { IQuery } from '@abms/kernel';
import { OnboardingTaskReadModel } from '../read-models/onboarding-task-read-model';

export class ListOnboardingTasksForEmployeeQuery implements IQuery<OnboardingTaskReadModel[]> {
  public readonly _resultType?: OnboardingTaskReadModel[];

  public constructor(public readonly employeeId: string) {}
}
