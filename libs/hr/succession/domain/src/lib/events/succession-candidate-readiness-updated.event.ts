import { DomainEvent } from '@abms/kernel';
import { ReadinessLevel } from './succession-candidate-nominated.event';

export class SuccessionCandidateReadinessUpdatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly readinessLevel: ReadinessLevel,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.succession-candidate.readiness-updated';
  }
}
