import { EntityId, TenantId } from '@abms/kernel';
import { EmploymentHistoryEntry } from './employment-history-entry';

// Insert-only, matching EmploymentHistoryEntry's WORM design — no save()/update()
// beyond append, and no delete().
export interface IEmploymentHistoryRepository {
  append(entry: EmploymentHistoryEntry): Promise<void>;
  findByEmployeeId(tenantId: TenantId, employeeId: EntityId): Promise<EmploymentHistoryEntry[]>;
}
