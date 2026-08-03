import { DomainEvent } from '@abms/kernel';

export class ReviewCycleOpenedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly name: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.review-cycle.opened';
  }
}
