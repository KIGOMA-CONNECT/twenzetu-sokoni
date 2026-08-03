import { EntityId, TenantId } from '@abms/kernel';
import { SalaryRevision } from './salary-revision';

// Insert-only, matching SalaryRevision's WORM design — no save()/update()
// beyond append, and no delete(). Mirrors IEmploymentHistoryRepository.
export interface ISalaryRevisionRepository {
  append(entry: SalaryRevision): Promise<void>;
  findByEmployeeId(tenantId: TenantId, employeeId: EntityId): Promise<SalaryRevision[]>;
}
