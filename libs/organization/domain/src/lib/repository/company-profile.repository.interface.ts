import { EntityId, IRepository } from '@abms/kernel';
import { CompanyProfile } from '../profiles/company-profile.aggregate';

export interface ICompanyProfileRepository extends IRepository<CompanyProfile, EntityId> {
  findByOrgUnitId(orgUnitId: EntityId): Promise<CompanyProfile | null>;
}
