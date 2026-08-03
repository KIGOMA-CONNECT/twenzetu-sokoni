import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { Payslip } from './payslip.aggregate';

export interface IPayslipRepository extends IRepository<Payslip, EntityId> {
  findByEmployeeAndPeriod(
    tenantId: TenantId,
    employeeId: EntityId,
    payrollPeriodId: EntityId,
  ): Promise<Payslip | null>;
  findAllByPeriod(tenantId: TenantId, payrollPeriodId: EntityId): Promise<Payslip[]>;
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<Payslip[]>;
}
