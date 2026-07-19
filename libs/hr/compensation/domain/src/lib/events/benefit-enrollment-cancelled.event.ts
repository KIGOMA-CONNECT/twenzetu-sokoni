import { DomainEvent } from '@abms/kernel';

export class BenefitEnrollmentCancelledEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
    public readonly benefitPlanId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.benefit-enrollment.cancelled';
  }
}
