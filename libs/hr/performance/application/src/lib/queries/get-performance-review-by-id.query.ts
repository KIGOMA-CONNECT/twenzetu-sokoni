import { IQuery } from '@abms/kernel';
import { PerformanceReviewReadModel } from '../read-models/performance-review-read-model';

export class GetPerformanceReviewByIdQuery implements IQuery<PerformanceReviewReadModel | null> {
  public readonly _resultType?: PerformanceReviewReadModel | null;

  public constructor(public readonly performanceReviewId: string) {}
}
