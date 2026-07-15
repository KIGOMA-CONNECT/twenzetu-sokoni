import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { LeaveType } from './leave-type.aggregate';

export interface ILeaveTypeRepository extends IRepository<LeaveType, EntityId> {
  findByCode(tenantId: TenantId, code: string): Promise<LeaveType | null>;
  findAllByTenant(tenantId: TenantId): Promise<LeaveType[]>;
}
