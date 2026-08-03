import { DomainEvent } from '@abms/kernel';

export class OrgUnitReactivatedEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'organization.org-unit.reactivated';
  }
}
