import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { OffboardingTask } from './offboarding-task.aggregate';

export interface IOffboardingTaskRepository extends IRepository<OffboardingTask, EntityId> {
  findAllByCase(tenantId: TenantId, offboardingCaseId: EntityId): Promise<OffboardingTask[]>;
}
