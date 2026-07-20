import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { EmployeeComplianceRecord } from './employee-compliance-record.aggregate';

export interface IEmployeeComplianceRecordRepository extends IRepository<EmployeeComplianceRecord, EntityId> {
  findPendingByEmployeeAndRequirement(
    tenantId: TenantId,
    employeeId: EntityId,
    complianceRequirementId: EntityId,
  ): Promise<EmployeeComplianceRecord | null>;
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<EmployeeComplianceRecord[]>;
  findAllByRequirement(tenantId: TenantId, complianceRequirementId: EntityId): Promise<EmployeeComplianceRecord[]>;
}
