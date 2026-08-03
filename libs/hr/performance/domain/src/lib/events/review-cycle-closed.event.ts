import { DomainEvent } from '@abms/kernel';

export class ReviewCycleClosedEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.review-cycle.closed';
  }
}
