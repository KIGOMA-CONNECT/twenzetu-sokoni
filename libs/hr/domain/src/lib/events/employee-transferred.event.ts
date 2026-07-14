import { DomainEvent } from '@abms/kernel';

export class EmployeeTransferredEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly previousOrgUnitId: string | null,
    public readonly newOrgUnitId: string | null,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.employee.transferred';
  }
}
