import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { ReviewCycleClosedEvent } from './events/review-cycle-closed.event';
import { ReviewCycleOpenedEvent } from './events/review-cycle-opened.event';

export type ReviewCycleStatus = 'OPEN' | 'CLOSED';

interface OpenReviewCycleProps {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly startDate: Date;
  readonly endDate: Date;
}

interface ReconstituteReviewCycleProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: ReviewCycleStatus;
}

// The period reviews are collected against (e.g. "2026 H1 Review") — mirrors
// PayrollPeriod's OPEN/CLOSED lifecycle (ADR-0010): PerformanceReviews may
// only be created/submitted while the owning cycle is OPEN.
export class ReviewCycle extends AggregateRoot<EntityId> {
  private _status: ReviewCycleStatus;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _name: string,
    private readonly _startDate: Date,
    private readonly _endDate: Date,
    status: ReviewCycleStatus,
  ) {
    super(id);
    this._status = status;
  }

  public static open(props: OpenReviewCycleProps): ReviewCycle {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    if (props.startDate.getTime() > props.endDate.getTime()) {
      throw new BusinessRuleViolationException('startDate must not be after endDate.');
    }

    const cycle = new ReviewCycle(
      EntityId.create(),
      props.tenantId,
      props.name,
      props.startDate,
      props.endDate,
      'OPEN',
    );
    cycle.addDomainEvent(new ReviewCycleOpenedEvent(cycle.id.toValue(), props.tenantId.value, props.name));
    return cycle;
  }

  public static reconstitute(props: ReconstituteReviewCycleProps): ReviewCycle {
    return new ReviewCycle(props.id, props.tenantId, props.name, props.startDate, props.endDate, props.status);
  }

  public close(): void {
    if (this._status === 'CLOSED') {
      throw new BusinessRuleViolationException('Review cycle is already closed.');
    }
    this._status = 'CLOSED';
    this.addDomainEvent(new ReviewCycleClosedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertOpen(): void {
    if (this._status !== 'OPEN') {
      throw new BusinessRuleViolationException(`Review cycle "${this._name}" is closed.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get name(): string {
    return this._name;
  }

  public get startDate(): Date {
    return this._startDate;
  }

  public get endDate(): Date {
    return this._endDate;
  }

  public get status(): ReviewCycleStatus {
    return this._status;
  }
}
