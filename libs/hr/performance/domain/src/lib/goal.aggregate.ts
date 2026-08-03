import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { GoalCancelledEvent } from './events/goal-cancelled.event';
import { GoalCompletedEvent } from './events/goal-completed.event';
import { GoalSetEvent } from './events/goal-set.event';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface SetGoalProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly title: string;
  readonly description: string | null;
  readonly targetDate: Date;
}

interface ReconstituteGoalProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly title: string;
  readonly description: string | null;
  readonly targetDate: Date;
  readonly status: GoalStatus;
  readonly progressPercent: number;
}

// An employee objective — deliberately flat (no OKR key-result sub-structure,
// no goal hierarchy/cascading) for v1. See ADR-0012.
export class Goal extends AggregateRoot<EntityId> {
  private _status: GoalStatus;
  private _progressPercent: number;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _title: string,
    private readonly _description: string | null,
    private readonly _targetDate: Date,
    status: GoalStatus,
    progressPercent: number,
  ) {
    super(id);
    this._status = status;
    this._progressPercent = progressPercent;
  }

  public static set(props: SetGoalProps): Goal {
    Guard.assert(Guard.againstEmptyString(props.title, 'title'));

    const goal = new Goal(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.title,
      props.description,
      props.targetDate,
      'ACTIVE',
      0,
    );
    goal.addDomainEvent(new GoalSetEvent(goal.id.toValue(), props.tenantId.value, props.employeeId.toValue()));
    return goal;
  }

  public static reconstitute(props: ReconstituteGoalProps): Goal {
    return new Goal(
      props.id,
      props.tenantId,
      props.employeeId,
      props.title,
      props.description,
      props.targetDate,
      props.status,
      props.progressPercent,
    );
  }

  private assertActive(action: string): void {
    if (this._status !== 'ACTIVE') {
      throw new BusinessRuleViolationException(`Cannot ${action}: goal is already ${this._status}.`);
    }
  }

  public updateProgress(percent: number): void {
    this.assertActive('update progress');
    Guard.assert(Guard.inRange(percent, 0, 100, 'percent'));
    this._progressPercent = percent;
  }

  public complete(): void {
    this.assertActive('complete');
    this._status = 'COMPLETED';
    this._progressPercent = 100;
    this.addDomainEvent(new GoalCompletedEvent(this.id.toValue(), this._tenantId.value));
  }

  public cancel(): void {
    this.assertActive('cancel');
    this._status = 'CANCELLED';
    this.addDomainEvent(new GoalCancelledEvent(this.id.toValue(), this._tenantId.value));
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | null {
    return this._description;
  }

  public get targetDate(): Date {
    return this._targetDate;
  }

  public get status(): GoalStatus {
    return this._status;
  }

  public get progressPercent(): number {
    return this._progressPercent;
  }
}
