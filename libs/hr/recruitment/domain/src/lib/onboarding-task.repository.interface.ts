import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { OnboardingTask } from './onboarding-task.aggregate';

export interface IOnboardingTaskRepository extends IRepository<OnboardingTask, EntityId> {
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<OnboardingTask[]>;
}
