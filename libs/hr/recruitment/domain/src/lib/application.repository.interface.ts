import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Application } from './application.aggregate';

export interface IApplicationRepository extends IRepository<Application, EntityId> {
  findAllByJobRequisition(tenantId: TenantId, jobRequisitionId: EntityId): Promise<Application[]>;
  findAllByCandidate(tenantId: TenantId, candidateId: EntityId): Promise<Application[]>;
}
