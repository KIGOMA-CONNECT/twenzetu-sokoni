import { DomainEvent } from '@abms/kernel';

export class ApplicationRejectedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly reason: string | null,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.application.rejected';
  }
}
