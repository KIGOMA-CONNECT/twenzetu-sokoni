import { DomainEvent } from '@abms/kernel';

export class PositionCreatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly code: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.position.created';
  }
}
