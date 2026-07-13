import { EntityId, IRepository } from '@abms/kernel';
import { ProfitCenterProfile } from '../profiles/profit-center-profile.aggregate';

export interface IProfitCenterProfileRepository extends IRepository<ProfitCenterProfile, EntityId> {
  findByOrgUnitId(orgUnitId: EntityId): Promise<ProfitCenterProfile | null>;
}
