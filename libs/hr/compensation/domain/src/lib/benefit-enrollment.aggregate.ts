import { AggregateRoot, BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { BenefitEnrollmentCancelledEvent } from './events/benefit-enrollment-cancelled.event';
import { BenefitEnrollmentCreatedEvent } from './events/benefit-enrollment-created.event';

export type BenefitEnrollmentStatus = 'ACTIVE' | 'CANCELLED';

interface EnrollProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly benefitPlanId: EntityId;
  readonly effectiveDate: Date;
}

interface ReconstituteBenefitEnrollmentProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly benefitPlanId: EntityId;
  readonly effectiveDate: Date;
  readonly status: BenefitEnrollmentStatus;
  readonly cancelledAt: Date | null;
}

// One ACTIVE enrollment per employee per plan, enforced by the handler +
// a partial unique index — mirrors OffboardingCase's "one active case per
// employee" pattern (ADR-0013, point 2).
export class BenefitEnrollment extends AggregateRoot<EntityId> {
  private _status: BenefitEnrollmentStatus;
  private _cancelledAt: Date | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _benefitPlanId: EntityId,
    private readonly _effectiveDate: Date,
    status: BenefitEnrollmentStatus,
    cancelledAt: Date | null,
  ) {
    super(id);
    this._status = status;
    this._cancelledAt = cancelledAt;
  }

  public static enroll(props: EnrollProps): BenefitEnrollment {
    const enrollment = new BenefitEnrollment(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.benefitPlanId,
      props.effectiveDate,
      'ACTIVE',
      null,
    );
    enrollment.addDomainEvent(
      new BenefitEnrollmentCreatedEvent(
        enrollment.id.toValue(),
        props.tenantId.value,
        props.employeeId.toValue(),
        props.benefitPlanId.toValue(),
      ),
    );
    return enrollment;
  }

  public static reconstitute(props: ReconstituteBenefitEnrollmentProps): BenefitEnrollment {
    return new BenefitEnrollment(
      props.id,
      props.tenantId,
      props.employeeId,
      props.benefitPlanId,
      props.effectiveDate,
      props.status,
      props.cancelledAt,
    );
  }

  public cancel(): void {
    if (this._status === 'CANCELLED') {
      throw new BusinessRuleViolationException('Benefit enrollment is already cancelled.');
    }
    this._status = 'CANCELLED';
    this._cancelledAt = new Date();
    this.addDomainEvent(
      new BenefitEnrollmentCancelledEvent(
        this.id.toValue(),
        this._tenantId.value,
        this._employeeId.toValue(),
        this._benefitPlanId.toValue(),
      ),
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get benefitPlanId(): EntityId {
    return this._benefitPlanId;
  }

  public get effectiveDate(): Date {
    return this._effectiveDate;
  }

  public get status(): BenefitEnrollmentStatus {
    return this._status;
  }

  public get cancelledAt(): Date | null {
    return this._cancelledAt;
  }
}
