import { DomainEvent } from '@abms/kernel';

export class PerformanceReviewSubmittedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
    public readonly rating: number,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.performance-review.submitted';
  }
}
