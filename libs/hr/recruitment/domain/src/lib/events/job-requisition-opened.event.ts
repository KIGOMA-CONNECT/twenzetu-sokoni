import { DomainEvent } from '@abms/kernel';

export class JobRequisitionOpenedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly positionId: string,
    public readonly headcount: number,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.job-requisition.opened';
  }
}
