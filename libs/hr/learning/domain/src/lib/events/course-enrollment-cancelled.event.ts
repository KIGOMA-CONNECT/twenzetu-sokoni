import { DomainEvent } from '@abms/kernel';

export class CourseEnrollmentCancelledEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly employeeId: string,
    public readonly courseId: string,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.course-enrollment.cancelled';
  }
}
