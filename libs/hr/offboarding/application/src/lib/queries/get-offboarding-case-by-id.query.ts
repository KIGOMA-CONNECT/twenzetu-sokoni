import { IQuery } from '@abms/kernel';
import { OffboardingCaseReadModel } from '../read-models/offboarding-case-read-model';

export class GetOffboardingCaseByIdQuery implements IQuery<OffboardingCaseReadModel | null> {
  public readonly _resultType?: OffboardingCaseReadModel | null;

  public constructor(public readonly offboardingCaseId: string) {}
}
