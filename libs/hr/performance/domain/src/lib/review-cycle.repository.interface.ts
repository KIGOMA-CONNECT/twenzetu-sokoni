import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { ReviewCycle } from './review-cycle.aggregate';

export interface IReviewCycleRepository extends IRepository<ReviewCycle, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<ReviewCycle[]>;
}
