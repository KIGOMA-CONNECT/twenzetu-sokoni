import { DomainEvent } from '@abms/kernel';

export type BenefitType =
  | 'HEALTH_INSURANCE'
  | 'PENSION'
  | 'LIFE_INSURANCE'
  | 'DISABILITY_INSURANCE'
  | 'OTHER';

export class BenefitPlanCreatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly benefitType: BenefitType,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.benefit-plan.created';
  }
}
