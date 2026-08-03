import { Email, EntityId, IRepository, TenantId } from '@abms/kernel';
import { Employee } from './employee.aggregate';

export interface IEmployeeRepository extends IRepository<Employee, EntityId> {
  findByEmployeeNumber(tenantId: TenantId, employeeNumber: string): Promise<Employee | null>;
  findByEmail(tenantId: TenantId, email: Email): Promise<Employee | null>;
  findAllByTenant(tenantId: TenantId): Promise<Employee[]>;
}
