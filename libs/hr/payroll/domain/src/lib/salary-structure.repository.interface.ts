import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { SalaryStructure } from './salary-structure.aggregate';

export interface ISalaryStructureRepository extends IRepository<SalaryStructure, EntityId> {
  findActiveByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<SalaryStructure | null>;
}
