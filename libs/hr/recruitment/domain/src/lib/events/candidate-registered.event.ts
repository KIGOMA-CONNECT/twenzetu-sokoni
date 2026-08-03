import { DomainEvent } from '@abms/kernel';

export class CandidateRegisteredEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly email: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.candidate.registered';
  }
}
