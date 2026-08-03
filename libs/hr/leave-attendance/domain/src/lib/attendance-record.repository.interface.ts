import { EntityId, IRepository, TenantId } from '@abms/kernel';
import { AttendanceRecord } from './attendance-record.aggregate';

export interface IAttendanceRecordRepository extends IRepository<AttendanceRecord, EntityId> {
  findByEmployeeAndDate(tenantId: TenantId, employeeId: EntityId, date: Date): Promise<AttendanceRecord | null>;
  findByEmployeeAndDateRange(
    tenantId: TenantId,
    employeeId: EntityId,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceRecord[]>;
}
