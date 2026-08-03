import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Goal } from './goal.aggregate';

export interface IGoalRepository extends IRepository<Goal, EntityId> {
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<Goal[]>;
}
