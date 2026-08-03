import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { WorkflowInstance } from './workflow-instance.aggregate';

export interface IWorkflowInstanceRepository extends IRepository<WorkflowInstance, EntityId> {
  findBySubject(tenantId: TenantId, subjectType: string, subjectId: string): Promise<WorkflowInstance[]>;
}
