import { DomainEvent } from '@abms/kernel';

export class EmployeeTerminatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly terminationDate: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.employee.terminated';
  }
}
