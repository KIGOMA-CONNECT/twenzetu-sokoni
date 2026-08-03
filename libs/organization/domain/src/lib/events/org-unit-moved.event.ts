import { DomainEvent } from '@abms/kernel';

export class OrgUnitMovedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly previousParentId: string | null,
    public readonly newParentId: string | null,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'organization.org-unit.moved';
  }
}
