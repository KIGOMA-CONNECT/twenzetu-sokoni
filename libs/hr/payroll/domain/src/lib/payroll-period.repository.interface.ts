import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { PayrollPeriod } from './payroll-period.aggregate';

export interface IPayrollPeriodRepository extends IRepository<PayrollPeriod, EntityId> {
  findByYearAndMonth(tenantId: TenantId, year: number, month: number): Promise<PayrollPeriod | null>;
  findAllByTenant(tenantId: TenantId): Promise<PayrollPeriod[]>;
}
