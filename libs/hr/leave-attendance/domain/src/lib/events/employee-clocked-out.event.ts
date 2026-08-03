import { DomainEvent } from '@abms/kernel';

export class EmployeeClockedOutEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
    public readonly hoursWorked: number,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.attendance.clocked-out';
  }
}
