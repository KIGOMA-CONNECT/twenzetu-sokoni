import { DomainEvent } from '@abms/kernel';

export class OrgUnitCreatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly orgUnitTypeId: string,
    public readonly parentId: string | null,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'organization.org-unit.created';
  }
}
