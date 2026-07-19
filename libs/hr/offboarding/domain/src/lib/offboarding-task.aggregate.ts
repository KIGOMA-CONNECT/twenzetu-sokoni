import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';

interface CreateOffboardingTaskProps {
  readonly tenantId: TenantId;
  readonly offboardingCaseId: EntityId;
  readonly employeeId: EntityId;
  readonly name: string;
}

interface ReconstituteOffboardingTaskProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly offboardingCaseId: EntityId;
  readonly employeeId: EntityId;
  readonly name: string;
  readonly isCompleted: boolean;
  readonly completedAt: Date | null;
}

// A single checklist item on a departing employee's exit plan — the
// offboarding mirror of OnboardingTask (see @abms/hr-recruitment-domain,
// ADR-0011). v1 emits no domain events on completion for the same reason:
// nothing subscribes to individual task completions yet. See ADR-0013.
export class OffboardingTask extends AggregateRoot<EntityId> {
  private _isCompleted: boolean;
  private _completedAt: Date | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _offboardingCaseId: EntityId,
    private readonly _employeeId: EntityId,
    private readonly _name: string,
    isCompleted: boolean,
    completedAt: Date | null,
  ) {
    super(id);
    this._isCompleted = isCompleted;
    this._completedAt = completedAt;
  }

  public static create(props: CreateOffboardingTaskProps): OffboardingTask {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    return new OffboardingTask(
      EntityId.create(),
      props.tenantId,
      props.offboardingCaseId,
      props.employeeId,
      props.name,
      false,
      null,
    );
  }

  public static reconstitute(props: ReconstituteOffboardingTaskProps): OffboardingTask {
    return new OffboardingTask(
      props.id,
      props.tenantId,
      props.offboardingCaseId,
      props.employeeId,
      props.name,
      props.isCompleted,
      props.completedAt,
    );
  }

  public complete(): void {
    if (this._isCompleted) {
      throw new BusinessRuleViolationException('Offboarding task is already completed.');
    }
    this._isCompleted = true;
    this._completedAt = new Date();
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get offboardingCaseId(): EntityId {
    return this._offboardingCaseId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get name(): string {
    return this._name;
  }

  public get isCompleted(): boolean {
    return this._isCompleted;
  }

  public get completedAt(): Date | null {
    return this._completedAt;
  }
}
