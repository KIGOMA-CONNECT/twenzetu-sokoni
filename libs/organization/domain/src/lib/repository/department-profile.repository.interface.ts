import { EntityId, IRepository } from '@abms/kernel';
import { DepartmentProfile } from '../profiles/department-profile.aggregate';

export interface IDepartmentProfileRepository extends IRepository<DepartmentProfile, EntityId> {
  findByOrgUnitId(orgUnitId: EntityId): Promise<DepartmentProfile | null>;
}
