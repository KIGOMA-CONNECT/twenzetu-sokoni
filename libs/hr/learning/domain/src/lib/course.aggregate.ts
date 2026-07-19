import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { CourseCategory, CourseCreatedEvent } from './events/course-created.event';
import { CourseDeactivatedEvent } from './events/course-deactivated.event';

export type { CourseCategory } from './events/course-created.event';

interface CreateCourseProps {
  readonly tenantId: TenantId;
  readonly title: string;
  readonly description: string | null;
  readonly durationHours: number;
  readonly category: CourseCategory;
}

interface ReconstituteCourseProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly title: string;
  readonly description: string | null;
  readonly durationHours: number;
  readonly category: CourseCategory;
  readonly isActive: boolean;
}

// A tenant-defined catalog entry that CourseEnrollment rows enroll
// employees into — structurally the same shape as BenefitPlan
// (@abms/hr-compensation-domain, ADR-0014): create/deactivate, no
// per-tenant configurable template beyond the fields captured here.
export class Course extends AggregateRoot<EntityId> {
  private _isActive: boolean;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _title: string,
    private readonly _description: string | null,
    private readonly _durationHours: number,
    private readonly _category: CourseCategory,
    isActive: boolean,
  ) {
    super(id);
    this._isActive = isActive;
  }

  public static create(props: CreateCourseProps): Course {
    Guard.assert(Guard.againstEmptyString(props.title, 'title'));
    Guard.assert(Guard.inRange(props.durationHours, 1, 1000, 'durationHours'));

    const course = new Course(
      EntityId.create(),
      props.tenantId,
      props.title,
      props.description,
      props.durationHours,
      props.category,
      true,
    );
    course.addDomainEvent(new CourseCreatedEvent(course.id.toValue(), props.tenantId.value, props.category));
    return course;
  }

  public static reconstitute(props: ReconstituteCourseProps): Course {
    return new Course(
      props.id,
      props.tenantId,
      props.title,
      props.description,
      props.durationHours,
      props.category,
      props.isActive,
    );
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new BusinessRuleViolationException(`Course "${this._title}" is already inactive.`);
    }
    this._isActive = false;
    this.addDomainEvent(new CourseDeactivatedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertActive(action: string): void {
    if (!this._isActive) {
      throw new BusinessRuleViolationException(`Cannot ${action}: course "${this._title}" is inactive.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | null {
    return this._description;
  }

  public get durationHours(): number {
    return this._durationHours;
  }

  public get category(): CourseCategory {
    return this._category;
  }

  public get isActive(): boolean {
    return this._isActive;
  }
}
