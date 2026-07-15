import { AttendanceRecordOrmEntity } from './entities/attendance-record-orm.entity';
import { LeaveBalanceOrmEntity } from './entities/leave-balance-orm.entity';
import { LeaveRequestOrmEntity } from './entities/leave-request-orm.entity';
import { LeaveTypeOrmEntity } from './entities/leave-type-orm.entity';

export const HR_LEAVE_ATTENDANCE_ENTITIES = [
  LeaveTypeOrmEntity,
  LeaveBalanceOrmEntity,
  LeaveRequestOrmEntity,
  AttendanceRecordOrmEntity,
];
