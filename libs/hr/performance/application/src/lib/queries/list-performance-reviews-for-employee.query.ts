import { IQuery } from '@abms/kernel';
import { PerformanceReviewReadModel } from '../read-models/performance-review-read-model';

export class ListPerformanceReviewsForEmployeeQuery implements IQuery<PerformanceReviewReadModel[]> {
  public readonly _resultType?: PerformanceReviewReadModel[];

  public constructor(public readonly employeeId: string) {}
}
