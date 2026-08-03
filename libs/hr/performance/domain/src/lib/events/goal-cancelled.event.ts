import { DomainEvent } from '@abms/kernel';

export class GoalCancelledEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.goal.cancelled';
  }
}
