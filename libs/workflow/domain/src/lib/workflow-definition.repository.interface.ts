import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { WorkflowDefinition } from './workflow-definition.aggregate';

export interface IWorkflowDefinitionRepository extends IRepository<WorkflowDefinition, EntityId> {
  findByCode(tenantId: TenantId, code: string): Promise<WorkflowDefinition | null>;
  findAllByTenant(tenantId: TenantId): Promise<WorkflowDefinition[]>;
}
