import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { LeaveRequest } from './leave-request.aggregate';

export interface ILeaveRequestRepository extends IRepository<LeaveRequest, EntityId> {
  findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<LeaveRequest[]>;
}
