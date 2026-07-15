import { DomainEvent } from '@abms/kernel';

export class LeaveRequestApprovedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly approvedByUserId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.leave-request.approved';
  }
}
