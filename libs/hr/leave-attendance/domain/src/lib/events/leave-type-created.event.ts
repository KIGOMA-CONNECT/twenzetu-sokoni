import { DomainEvent } from '@abms/kernel';

export class LeaveTypeCreatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly code: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.leave-type.created';
  }
}
