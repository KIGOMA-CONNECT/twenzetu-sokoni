import { IQuery } from '@abms/kernel';
import { SuccessionCandidateReadModel } from '../read-models/succession-candidate-read-model';

export class ListCandidatesForPlanQuery implements IQuery<SuccessionCandidateReadModel[]> {
  public readonly _resultType?: SuccessionCandidateReadModel[];

  public constructor(public readonly successionPlanId: string) {}
}
