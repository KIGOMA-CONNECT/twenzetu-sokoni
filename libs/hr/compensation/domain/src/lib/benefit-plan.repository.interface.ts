import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { BenefitPlan } from './benefit-plan.aggregate';

export interface IBenefitPlanRepository extends IRepository<BenefitPlan, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<BenefitPlan[]>;
}
