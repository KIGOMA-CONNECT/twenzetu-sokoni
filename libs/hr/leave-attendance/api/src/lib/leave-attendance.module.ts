import {
  HR_LEAVE_ATTENDANCE_COMMAND_HANDLERS,
  HR_LEAVE_ATTENDANCE_QUERY_HANDLERS,
} from '@abms/hr-leave-attendance-infrastructure';
import { Module } from '@nestjs/common';
import { LeaveAttendanceController } from './leave-attendance.controller';

@Module({
  controllers: [LeaveAttendanceController],
  providers: [...HR_LEAVE_ATTENDANCE_COMMAND_HANDLERS, ...HR_LEAVE_ATTENDANCE_QUERY_HANDLERS],
})
export class LeaveAttendanceModule {}
