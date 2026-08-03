import { DomainEvent } from '@abms/kernel';

export type CourseCategory = 'COMPLIANCE' | 'TECHNICAL' | 'LEADERSHIP' | 'SOFT_SKILLS' | 'OTHER';

export class CourseCreatedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly category: CourseCategory,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.course.created';
  }
}
