import { EntityId, IRepository } from '@abms/kernel';
import { CostCenterProfile } from '../profiles/cost-center-profile.aggregate';

export interface ICostCenterProfileRepository extends IRepository<CostCenterProfile, EntityId> {
  findByOrgUnitId(orgUnitId: EntityId): Promise<CostCenterProfile | null>;
}
