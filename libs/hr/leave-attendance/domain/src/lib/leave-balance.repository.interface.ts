import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { LeaveBalance } from './leave-balance.aggregate';

export interface ILeaveBalanceRepository extends IRepository<LeaveBalance, EntityId> {
  findByEmployeeLeaveTypeAndYear(
    tenantId: TenantId,
    employeeId: EntityId,
    leaveTypeId: EntityId,
    year: number,
  ): Promise<LeaveBalance | null>;
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId, year: number): Promise<LeaveBalance[]>;
}
