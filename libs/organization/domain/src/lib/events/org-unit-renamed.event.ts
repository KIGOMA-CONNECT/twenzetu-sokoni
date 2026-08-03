import { DomainEvent } from '@abms/kernel';

export class OrgUnitRenamedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly previousName: string,
    public readonly newName: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'organization.org-unit.renamed';
  }
}
