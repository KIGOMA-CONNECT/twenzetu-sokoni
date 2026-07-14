import { DomainEvent } from '@abms/kernel';

export class WorkflowInstanceStartedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly workflowDefinitionId: string,
    public readonly subjectType: string,
    public readonly subjectId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'workflow.instance.started';
  }
}
