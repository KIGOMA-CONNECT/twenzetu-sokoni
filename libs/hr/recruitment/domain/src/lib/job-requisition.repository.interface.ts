import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { JobRequisition } from './job-requisition.aggregate';

export interface IJobRequisitionRepository extends IRepository<JobRequisition, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<JobRequisition[]>;
}
