import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { OrgUnit } from '../org-unit.aggregate';

export interface IOrgUnitRepository extends IRepository<OrgUnit, EntityId> {
  findByCode(tenantId: TenantId, code: string): Promise<OrgUnit | null>;

  /** True when moving `nodeId` under `candidateNewParentId` would create a cycle (self-move or into-own-descendant). */
  wouldCreateCycle(nodeId: EntityId, candidateNewParentId: EntityId): Promise<boolean>;
}
