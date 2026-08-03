import { IQuery } from '@abms/kernel';
import { PerformanceReviewReadModel } from '../read-models/performance-review-read-model';

export class ListPerformanceReviewsForCycleQuery implements IQuery<PerformanceReviewReadModel[]> {
  public readonly _resultType?: PerformanceReviewReadModel[];

  public constructor(public readonly reviewCycleId: string) {}
}
