import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Course } from './course.aggregate';

export interface ICourseRepository extends IRepository<Course, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<Course[]>;
}
