import { DomainEvent } from '@abms/kernel';

export class WorkflowDefinitionCreatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly code: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'workflow.definition.created';
  }
}
