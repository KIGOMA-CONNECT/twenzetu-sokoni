import { DomainEvent } from '@abms/kernel';

export class LeaveRequestRejectedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly rejectedByUserId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.leave-request.rejected';
  }
}
