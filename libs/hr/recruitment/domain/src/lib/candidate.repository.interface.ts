import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Candidate } from './candidate.aggregate';

export interface ICandidateRepository extends IRepository<Candidate, EntityId> {
  findAllByTenant(tenantId: TenantId): Promise<Candidate[]>;
}
