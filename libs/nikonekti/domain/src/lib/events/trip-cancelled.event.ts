import { DomainEvent } from '@abms/kernel';

export class TripCancelledEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly reason: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.trip.cancelled';
  }
}
