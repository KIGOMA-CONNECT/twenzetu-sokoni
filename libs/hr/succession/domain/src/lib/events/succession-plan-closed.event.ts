import { DomainEvent } from '@abms/kernel';

export class SuccessionPlanClosedEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.succession-plan.closed';
  }
}
