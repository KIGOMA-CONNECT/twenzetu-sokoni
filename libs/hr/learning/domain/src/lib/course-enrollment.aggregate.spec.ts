import { EntityId, TenantId } from '@abms/kernel';
import { CourseEnrollment } from './course-enrollment.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('CourseEnrollment', () => {
  it('enrolls as in-progress and emits an event', () => {
    const enrollment = CourseEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      courseId: EntityId.create(),
      enrolledDate: new Date('2026-08-01'),
    });

    expect(enrollment.status).toBe('IN_PROGRESS');
    expect(enrollment.domainEvents).toHaveLength(1);
  });

  it('complete() records a score and completion date', () => {
    const enrollment = CourseEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      courseId: EntityId.create(),
      enrolledDate: new Date('2026-08-01'),
    });

    enrollment.complete(new Date('2026-08-05'), 92);

    expect(enrollment.status).toBe('COMPLETED');
    expect(enrollment.score).toBe(92);
    expect(enrollment.completedDate).not.toBeNull();
  });

  it('rejects a score above 100', () => {
    const enrollment = CourseEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      courseId: EntityId.create(),
      enrolledDate: new Date('2026-08-01'),
    });

    expect(() => enrollment.complete(new Date('2026-08-05'), 101)).toThrow();
  });

  it('cancel() is not idempotent once completed', () => {
    const enrollment = CourseEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      courseId: EntityId.create(),
      enrolledDate: new Date('2026-08-01'),
    });
    enrollment.complete(new Date('2026-08-05'), null);

    expect(() => enrollment.cancel()).toThrow();
  });
});
