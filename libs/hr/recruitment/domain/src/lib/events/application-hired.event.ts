import { DomainEvent } from '@abms/kernel';

export class ApplicationHiredEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly candidateId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.application.hired';
  }
}
