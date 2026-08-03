import { DomainEvent } from '@abms/kernel';

export class TripAssignedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly driverId: string,
    public readonly vehicleId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.trip.assigned';
  }
}
