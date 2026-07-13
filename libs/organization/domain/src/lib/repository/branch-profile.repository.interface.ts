import { EntityId, IRepository } from '@abms/kernel';
import { BranchProfile } from '../profiles/branch-profile.aggregate';

export interface IBranchProfileRepository extends IRepository<BranchProfile, EntityId> {
  findByOrgUnitId(orgUnitId: EntityId): Promise<BranchProfile | null>;
}
