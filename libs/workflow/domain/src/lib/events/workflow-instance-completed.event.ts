import { DomainEvent } from '@abms/kernel';

export class WorkflowInstanceCompletedEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'workflow.instance.completed';
  }
}
