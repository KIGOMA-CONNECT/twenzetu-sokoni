import { DomainEvent } from '@abms/kernel';

export class SuccessionPlanOpenedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly positionId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.succession-plan.opened';
  }
}
