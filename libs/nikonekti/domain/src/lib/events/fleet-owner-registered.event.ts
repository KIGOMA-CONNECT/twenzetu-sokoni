import { DomainEvent } from '@abms/kernel';

export class FleetOwnerRegisteredEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.fleet-owner.registered';
  }
}
