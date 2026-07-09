import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { OrgUnitType } from '../org-unit-type.aggregate';

export interface IOrgUnitTypeRepository extends IRepository<OrgUnitType, EntityId> {
  findByCode(tenantId: TenantId, code: string): Promise<OrgUnitType | null>;
  findAllByTenant(tenantId: TenantId): Promise<OrgUnitType[]>;
}
