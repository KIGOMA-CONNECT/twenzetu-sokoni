import { DomainEvent } from '@abms/kernel';

export class TripStartedEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.trip.started';
  }
}
