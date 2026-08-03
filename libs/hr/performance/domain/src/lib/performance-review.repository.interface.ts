import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { PerformanceReview } from './performance-review.aggregate';

export interface IPerformanceReviewRepository extends IRepository<PerformanceReview, EntityId> {
  findByEmployeeAndCycle(
    tenantId: TenantId,
    employeeId: EntityId,
    reviewCycleId: EntityId,
  ): Promise<PerformanceReview | null>;
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<PerformanceReview[]>;
  findAllByCycle(tenantId: TenantId, reviewCycleId: EntityId): Promise<PerformanceReview[]>;
}
