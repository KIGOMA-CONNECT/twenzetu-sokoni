import { IQuery } from '@abms/kernel';
import { BenefitPlanReadModel } from '../read-models/benefit-plan-read-model';

export class ListBenefitPlansQuery implements IQuery<BenefitPlanReadModel[]> {
  public readonly _resultType?: BenefitPlanReadModel[];
}
