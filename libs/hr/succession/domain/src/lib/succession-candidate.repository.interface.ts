import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { SuccessionCandidate } from './succession-candidate.aggregate';

export interface ISuccessionCandidateRepository extends IRepository<SuccessionCandidate, EntityId> {
  findByPlanAndEmployee(
    tenantId: TenantId,
    successionPlanId: EntityId,
    employeeId: EntityId,
  ): Promise<SuccessionCandidate | null>;
  findAllByPlan(tenantId: TenantId, successionPlanId: EntityId): Promise<SuccessionCandidate[]>;
}
