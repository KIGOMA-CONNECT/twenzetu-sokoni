import { DomainEvent } from '@abms/kernel';

export type OffboardingExitReason =
  | 'RESIGNATION'
  | 'TERMINATION'
  | 'RETIREMENT'
  | 'END_OF_CONTRACT'
  | 'OTHER';

export class OffboardingCaseInitiatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
    public readonly exitReason: OffboardingExitReason,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.offboarding-case.initiated';
  }
}
