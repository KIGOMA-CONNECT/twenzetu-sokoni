import { DomainEvent } from '@abms/kernel';

export class ApplicationSubmittedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly candidateId: string,
    public readonly jobRequisitionId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.application.submitted';
  }
}
