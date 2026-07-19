import { AggregateRoot, BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { OffboardingCaseCancelledEvent } from './events/offboarding-case-cancelled.event';
import { OffboardingCaseCompletedEvent } from './events/offboarding-case-completed.event';
import { OffboardingCaseInitiatedEvent, OffboardingExitReason } from './events/offboarding-case-initiated.event';

export type OffboardingCaseStatus = 'INITIATED' | 'COMPLETED' | 'CANCELLED';

interface InitiateOffboardingCaseProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly exitReason: OffboardingExitReason;
  readonly lastWorkingDay: Date;
}

interface ReconstituteOffboardingCaseProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly exitReason: OffboardingExitReason;
  readonly lastWorkingDay: Date;
  readonly status: OffboardingCaseStatus;
}

// The container for an employee's exit process. Completing a case is the
// trigger that terminates the Employee aggregate (see OffboardingInfrastructure's
// CompleteOffboardingCaseHandler, which mirrors HireCandidateHandler's direct
// cross-module Employee mutation — see ADR-0011 point 1, ADR-0013).
export class OffboardingCase extends AggregateRoot<EntityId> {
  private _status: OffboardingCaseStatus;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _exitReason: OffboardingExitReason,
    private readonly _lastWorkingDay: Date,
    status: OffboardingCaseStatus,
  ) {
    super(id);
    this._status = status;
  }

  public static initiate(props: InitiateOffboardingCaseProps): OffboardingCase {
    const offboardingCase = new OffboardingCase(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.exitReason,
      props.lastWorkingDay,
      'INITIATED',
    );
    offboardingCase.addDomainEvent(
      new OffboardingCaseInitiatedEvent(
        offboardingCase.id.toValue(),
        props.tenantId.value,
        props.employeeId.toValue(),
        props.exitReason,
      ),
    );
    return offboardingCase;
  }

  public static reconstitute(props: ReconstituteOffboardingCaseProps): OffboardingCase {
    return new OffboardingCase(
      props.id,
      props.tenantId,
      props.employeeId,
      props.exitReason,
      props.lastWorkingDay,
      props.status,
    );
  }

  public assertInitiated(action: string): void {
    if (this._status !== 'INITIATED') {
      throw new BusinessRuleViolationException(`Cannot ${action}: offboarding case is already ${this._status}.`);
    }
  }

  public complete(): void {
    this.assertInitiated('complete');
    this._status = 'COMPLETED';
    this.addDomainEvent(
      new OffboardingCaseCompletedEvent(this.id.toValue(), this._tenantId.value, this._employeeId.toValue()),
    );
  }

  public cancel(): void {
    this.assertInitiated('cancel');
    this._status = 'CANCELLED';
    this.addDomainEvent(
      new OffboardingCaseCancelledEvent(this.id.toValue(), this._tenantId.value, this._employeeId.toValue()),
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get exitReason(): OffboardingExitReason {
    return this._exitReason;
  }

  public get lastWorkingDay(): Date {
    return this._lastWorkingDay;
  }

  public get status(): OffboardingCaseStatus {
    return this._status;
  }
}
