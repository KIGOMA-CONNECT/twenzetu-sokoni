import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { SuccessionPlan } from './succession-plan.aggregate';

export interface ISuccessionPlanRepository extends IRepository<SuccessionPlan, EntityId> {
  findOpenByPosition(tenantId: TenantId, positionId: EntityId): Promise<SuccessionPlan | null>;
  findAllByTenant(tenantId: TenantId): Promise<SuccessionPlan[]>;
}
