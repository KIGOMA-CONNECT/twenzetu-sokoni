import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { CourseEnrollment } from './course-enrollment.aggregate';

export interface ICourseEnrollmentRepository extends IRepository<CourseEnrollment, EntityId> {
  findActiveByEmployeeAndCourse(
    tenantId: TenantId,
    employeeId: EntityId,
    courseId: EntityId,
  ): Promise<CourseEnrollment | null>;
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<CourseEnrollment[]>;
}
