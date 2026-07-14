import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { EmployeeDocument } from './employee-document.aggregate';

export interface IEmployeeDocumentRepository extends IRepository<EmployeeDocument, EntityId> {
  findByEmployeeId(tenantId: TenantId, employeeId: EntityId): Promise<EmployeeDocument[]>;
}
