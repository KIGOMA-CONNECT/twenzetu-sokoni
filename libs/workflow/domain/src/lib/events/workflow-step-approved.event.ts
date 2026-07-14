import { DomainEvent } from '@abms/kernel';

export class WorkflowStepApprovedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly stepOrder: number,
    public readonly approverUserId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'workflow.instance.step-approved';
  }
}
