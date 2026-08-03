import { DomainEvent } from '@abms/kernel';

export class TripCompletedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly driverId: string,
    public readonly driverEarning: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.trip.completed';
  }
}
