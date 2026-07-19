import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { CourseEnrollmentCancelledEvent } from './events/course-enrollment-cancelled.event';
import { CourseEnrollmentCompletedEvent } from './events/course-enrollment-completed.event';
import { CourseEnrollmentCreatedEvent } from './events/course-enrollment-created.event';

export type CourseEnrollmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface EnrollProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly courseId: EntityId;
  readonly enrolledDate: Date;
}

interface ReconstituteCourseEnrollmentProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly courseId: EntityId;
  readonly enrolledDate: Date;
  readonly status: CourseEnrollmentStatus;
  readonly score: number | null;
  readonly completedDate: Date | null;
}

// One IN_PROGRESS enrollment per employee per course, enforced by the
// handler + a partial unique index — mirrors BenefitEnrollment's "one
// active enrollment per employee per plan" pattern (ADR-0014, point 4).
export class CourseEnrollment extends AggregateRoot<EntityId> {
  private _status: CourseEnrollmentStatus;
  private _score: number | null;
  private _completedDate: Date | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _courseId: EntityId,
    private readonly _enrolledDate: Date,
    status: CourseEnrollmentStatus,
    score: number | null,
    completedDate: Date | null,
  ) {
    super(id);
    this._status = status;
    this._score = score;
    this._completedDate = completedDate;
  }

  public static enroll(props: EnrollProps): CourseEnrollment {
    const enrollment = new CourseEnrollment(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.courseId,
      props.enrolledDate,
      'IN_PROGRESS',
      null,
      null,
    );
    enrollment.addDomainEvent(
      new CourseEnrollmentCreatedEvent(
        enrollment.id.toValue(),
        props.tenantId.value,
        props.employeeId.toValue(),
        props.courseId.toValue(),
      ),
    );
    return enrollment;
  }

  public static reconstitute(props: ReconstituteCourseEnrollmentProps): CourseEnrollment {
    return new CourseEnrollment(
      props.id,
      props.tenantId,
      props.employeeId,
      props.courseId,
      props.enrolledDate,
      props.status,
      props.score,
      props.completedDate,
    );
  }

  private assertInProgress(action: string): void {
    if (this._status !== 'IN_PROGRESS') {
      throw new BusinessRuleViolationException(`Cannot ${action}: enrollment is already ${this._status}.`);
    }
  }

  public complete(completedDate: Date, score: number | null): void {
    this.assertInProgress('complete');
    if (score !== null) {
      Guard.assert(Guard.inRange(score, 0, 100, 'score'));
    }
    this._status = 'COMPLETED';
    this._score = score;
    this._completedDate = completedDate;
    this.addDomainEvent(
      new CourseEnrollmentCompletedEvent(
        this.id.toValue(),
        this._tenantId.value,
        this._employeeId.toValue(),
        this._courseId.toValue(),
      ),
    );
  }

  public cancel(): void {
    this.assertInProgress('cancel');
    this._status = 'CANCELLED';
    this.addDomainEvent(
      new CourseEnrollmentCancelledEvent(
        this.id.toValue(),
        this._tenantId.value,
        this._employeeId.toValue(),
        this._courseId.toValue(),
      ),
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get courseId(): EntityId {
    return this._courseId;
  }

  public get enrolledDate(): Date {
    return this._enrolledDate;
  }

  public get status(): CourseEnrollmentStatus {
    return this._status;
  }

  public get score(): number | null {
    return this._score;
  }

  public get completedDate(): Date | null {
    return this._completedDate;
  }
}
