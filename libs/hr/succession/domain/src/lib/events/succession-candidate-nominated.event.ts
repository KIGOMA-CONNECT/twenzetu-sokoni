import { DomainEvent } from '@abms/kernel';

export type ReadinessLevel = 'READY_NOW' | 'READY_1_2_YEARS' | 'READY_3_5_YEARS' | 'NOT_READY';

export class SuccessionCandidateNominatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly successionPlanId: string,
    public readonly employeeId: string,
    public readonly readinessLevel: ReadinessLevel,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.succession-candidate.nominated';
  }
}
