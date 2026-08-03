import { DomainEvent } from '@abms/kernel';

export class EmployeeHiredEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeNumber: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.employee.hired';
  }
}
