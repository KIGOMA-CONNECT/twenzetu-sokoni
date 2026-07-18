import { DomainEvent } from '@abms/kernel';

export class PerformanceReviewAcknowledgedEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.performance-review.acknowledged';
  }
}
