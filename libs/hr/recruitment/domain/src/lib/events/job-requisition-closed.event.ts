import { DomainEvent } from '@abms/kernel';

export type JobRequisitionCloseReason = 'FILLED' | 'CANCELLED';

export class JobRequisitionClosedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly reason: JobRequisitionCloseReason,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.job-requisition.closed';
  }
}
