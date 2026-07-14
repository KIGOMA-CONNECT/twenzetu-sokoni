import { DomainEvent } from '@abms/kernel';

export class EmployeePositionChangedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly previousPositionId: string | null,
    public readonly newPositionId: string | null,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.employee.position-changed';
  }
}
