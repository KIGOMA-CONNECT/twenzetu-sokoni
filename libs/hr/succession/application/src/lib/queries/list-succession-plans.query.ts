import { IQuery } from '@abms/kernel';
import { SuccessionPlanReadModel } from '../read-models/succession-plan-read-model';

export class ListSuccessionPlansQuery implements IQuery<SuccessionPlanReadModel[]> {
  public readonly _resultType?: SuccessionPlanReadModel[];
}
