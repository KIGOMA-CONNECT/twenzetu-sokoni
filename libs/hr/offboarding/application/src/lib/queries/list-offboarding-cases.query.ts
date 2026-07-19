import { IQuery } from '@abms/kernel';
import { OffboardingCaseReadModel } from '../read-models/offboarding-case-read-model';

export class ListOffboardingCasesQuery implements IQuery<OffboardingCaseReadModel[]> {
  public readonly _resultType?: OffboardingCaseReadModel[];
}
