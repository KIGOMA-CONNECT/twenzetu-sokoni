import { DomainEvent } from '@abms/kernel';

export class OffboardingCaseCancelledEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.offboarding-case.cancelled';
  }
}
