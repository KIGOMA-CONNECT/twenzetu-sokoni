import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';

interface CreateOnboardingTaskProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly name: string;
}

interface ReconstituteOnboardingTaskProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly name: string;
  readonly isCompleted: boolean;
  readonly completedAt: Date | null;
}

// A single checklist item on a new hire's onboarding plan. v1 emits no
// domain events on completion — nothing subscribes to individual task
// completions yet, and a whole-checklist-complete signal (if ever needed)
// belongs to a future OnboardingChecklist aggregate, not this one. See
// ADR-0011.
export class OnboardingTask extends AggregateRoot<EntityId> {
  private _isCompleted: boolean;
  private _completedAt: Date | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _name: string,
    isCompleted: boolean,
    completedAt: Date | null,
  ) {
    super(id);
    this._isCompleted = isCompleted;
    this._completedAt = completedAt;
  }

  public static create(props: CreateOnboardingTaskProps): OnboardingTask {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    return new OnboardingTask(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.name,
      false,
      null,
    );
  }

  public static reconstitute(props: ReconstituteOnboardingTaskProps): OnboardingTask {
    return new OnboardingTask(
      props.id,
      props.tenantId,
      props.employeeId,
      props.name,
      props.isCompleted,
      props.completedAt,
    );
  }

  public complete(): void {
    if (this._isCompleted) {
      throw new BusinessRuleViolationException('Onboarding task is already completed.');
    }
    this._isCompleted = true;
    this._completedAt = new Date();
  }

  public get tenantId(): TenantId {
    return this._tenantId;
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
