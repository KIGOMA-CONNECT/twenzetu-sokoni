import { IQuery } from '@abms/kernel';
import { ApplicationReadModel } from '../read-models/application-read-model';

export class ListApplicationsForCandidateQuery implements IQuery<ApplicationReadModel[]> {
  public readonly _resultType?: ApplicationReadModel[];

  public constructor(public readonly candidateId: string) {}
}
