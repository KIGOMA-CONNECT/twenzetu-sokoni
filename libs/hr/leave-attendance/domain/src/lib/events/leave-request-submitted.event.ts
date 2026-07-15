import { DomainEvent } from '@abms/kernel';

export class LeaveRequestSubmittedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
    public readonly leaveTypeId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.leave-request.submitted';
  }
}
