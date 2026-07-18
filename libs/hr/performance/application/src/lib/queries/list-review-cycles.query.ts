import { IQuery } from '@abms/kernel';
import { ReviewCycleReadModel } from '../read-models/review-cycle-read-model';

export class ListReviewCyclesQuery implements IQuery<ReviewCycleReadModel[]> {
  public readonly _resultType?: ReviewCycleReadModel[];
}
