import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { PerformanceReviewAcknowledgedEvent } from './events/performance-review-acknowledged.event';
import { PerformanceReviewSubmittedEvent } from './events/performance-review-submitted.event';

export type PerformanceReviewStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';

interface StartPerformanceReviewProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly reviewCycleId: EntityId;
  readonly reviewerUserId: string;
}

interface ReconstitutePerformanceReviewProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly reviewCycleId: EntityId;
  readonly reviewerUserId: string;
  readonly rating: number | null;
  readonly comments: string | null;
  readonly status: PerformanceReviewStatus;
  readonly submittedAt: Date | null;
  readonly acknowledgedAt: Date | null;
}

// One review per employee per cycle. Rating is a plain 1-5 scale (v1 does
// not model competency-level sub-ratings or 360-degree multi-rater
// aggregation — see ADR-0012). DRAFT -> SUBMITTED (by the reviewer) ->
// ACKNOWLEDGED (by the employee) is a one-way pipeline, matching the same
// forward-only state-machine family as LeaveRequest/Application.
export class PerformanceReview extends AggregateRoot<EntityId> {
  private _rating: number | null;
  private _comments: string | null;
  private _status: PerformanceReviewStatus;
  private _submittedAt: Date | null;
  private _acknowledgedAt: Date | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _reviewCycleId: EntityId,
    private readonly _reviewerUserId: string,
    rating: number | null,
    comments: string | null,
    status: PerformanceReviewStatus,
    submittedAt: Date | null,
    acknowledgedAt: Date | null,
  ) {
    super(id);
    this._rating = rating;
    this._comments = comments;
    this._status = status;
    this._submittedAt = submittedAt;
    this._acknowledgedAt = acknowledgedAt;
  }

  public static start(props: StartPerformanceReviewProps): PerformanceReview {
    return new PerformanceReview(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.reviewCycleId,
      props.reviewerUserId,
      null,
      null,
      'DRAFT',
      null,
      null,
    );
  }

  public static reconstitute(props: ReconstitutePerformanceReviewProps): PerformanceReview {
    return new PerformanceReview(
      props.id,
      props.tenantId,
      props.employeeId,
      props.reviewCycleId,
      props.reviewerUserId,
      props.rating,
      props.comments,
      props.status,
      props.submittedAt,
      props.acknowledgedAt,
    );
  }

  public submit(rating: number, comments: string | null): void {
    if (this._status !== 'DRAFT') {
      throw new BusinessRuleViolationException(`Cannot submit: review is already ${this._status}.`);
    }
    Guard.assert(Guard.inRange(rating, 1, 5, 'rating'));

    this._rating = rating;
    this._comments = comments;
    this._status = 'SUBMITTED';
    this._submittedAt = new Date();
    this.addDomainEvent(
      new PerformanceReviewSubmittedEvent(this.id.toValue(), this._tenantId.value, this._employeeId.toValue(), rating),
    );
  }

  public acknowledge(): void {
    if (this._status !== 'SUBMITTED') {
      throw new BusinessRuleViolationException(
        `Cannot acknowledge: review must be SUBMITTED first (currently ${this._status}).`,
      );
    }
    this._status = 'ACKNOWLEDGED';
    this._acknowledgedAt = new Date();
    this.addDomainEvent(new PerformanceReviewAcknowledgedEvent(this.id.toValue(), this._tenantId.value));
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get reviewCycleId(): EntityId {
    return this._reviewCycleId;
  }

  public get reviewerUserId(): string {
    return this._reviewerUserId;
  }

  public get rating(): number | null {
    return this._rating;
  }

  public get comments(): string | null {
    return this._comments;
  }

  public get status(): PerformanceReviewStatus {
    return this._status;
  }

  public get submittedAt(): Date | null {
    return this._submittedAt;
  }

  public get acknowledgedAt(): Date | null {
    return this._acknowledgedAt;
  }
}
