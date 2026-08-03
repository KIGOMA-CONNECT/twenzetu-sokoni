import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { BenefitPlanCreatedEvent, BenefitType } from './events/benefit-plan-created.event';
import { BenefitPlanDeactivatedEvent } from './events/benefit-plan-deactivated.event';

export type { BenefitType } from './events/benefit-plan-created.event';

interface CreateBenefitPlanProps {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly benefitType: BenefitType;
  readonly employerContributionRateBasisPoints: number;
}

interface ReconstituteBenefitPlanProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly benefitType: BenefitType;
  readonly employerContributionRateBasisPoints: number;
  readonly isActive: boolean;
}

// A tenant-defined catalog entry ("Gold Health Plan", "Pension Scheme A")
// that BenefitEnrollment rows enroll employees into. The contribution rate
// is basis points (e.g. 500 = 5%), matching the convention already
// established for Payroll's statutory rates (ADR-0010) rather than a float
// percentage — "no floats for money, ever" applies equally to rates that
// feed money math.
export class BenefitPlan extends AggregateRoot<EntityId> {
  private _isActive: boolean;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _name: string,
    private readonly _benefitType: BenefitType,
    private readonly _employerContributionRateBasisPoints: number,
    isActive: boolean,
  ) {
    super(id);
    this._isActive = isActive;
  }

  public static create(props: CreateBenefitPlanProps): BenefitPlan {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    Guard.assert(
      Guard.inRange(props.employerContributionRateBasisPoints, 0, 10_000, 'employerContributionRateBasisPoints'),
    );

    const plan = new BenefitPlan(
      EntityId.create(),
      props.tenantId,
      props.name,
      props.benefitType,
      props.employerContributionRateBasisPoints,
      true,
    );
    plan.addDomainEvent(
      new BenefitPlanCreatedEvent(plan.id.toValue(), props.tenantId.value, props.benefitType),
    );
    return plan;
  }

  public static reconstitute(props: ReconstituteBenefitPlanProps): BenefitPlan {
    return new BenefitPlan(
      props.id,
      props.tenantId,
      props.name,
      props.benefitType,
      props.employerContributionRateBasisPoints,
      props.isActive,
    );
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new BusinessRuleViolationException(`Benefit plan "${this._name}" is already inactive.`);
    }
    this._isActive = false;
    this.addDomainEvent(new BenefitPlanDeactivatedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertActive(action: string): void {
    if (!this._isActive) {
      throw new BusinessRuleViolationException(`Cannot ${action}: benefit plan "${this._name}" is inactive.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get name(): string {
    return this._name;
  }

  public get benefitType(): BenefitType {
    return this._benefitType;
  }

  public get employerContributionRateBasisPoints(): number {
    return this._employerContributionRateBasisPoints;
  }

  public get isActive(): boolean {
    return this._isActive;
  }
}
