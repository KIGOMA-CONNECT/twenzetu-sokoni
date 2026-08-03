import { DomainEvent } from '@abms/kernel';

export type VehicleCategory = 'MOTORCYCLE' | 'TRICYCLE' | 'CAR' | 'VAN' | 'TRUCK';

export class VehicleRegisteredEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly category: VehicleCategory,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.vehicle.registered';
  }
}
