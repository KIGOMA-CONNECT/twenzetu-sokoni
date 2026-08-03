import { IQuery } from '@abms/kernel';
import { CandidateReadModel } from '../read-models/candidate-read-model';

export class ListCandidatesQuery implements IQuery<CandidateReadModel[]> {
  public readonly _resultType?: CandidateReadModel[];
}
