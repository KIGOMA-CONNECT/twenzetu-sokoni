import { AllocateLeaveBalanceHandler } from './handlers/allocate-leave-balance.handler';
import { ApproveLeaveRequestHandler } from './handlers/approve-leave-request.handler';
import { CancelLeaveRequestHandler } from './handlers/cancel-leave-request.handler';
import { ClockInHandler } from './handlers/clock-in.handler';
import { ClockOutHandler } from './handlers/clock-out.handler';
import { CreateLeaveTypeHandler } from './handlers/create-leave-type.handler';
import { GetAttendanceForEmployeeHandler } from './handlers/get-attendance-for-employee.handler';
import { ListLeaveBalancesForEmployeeHandler } from './handlers/list-leave-balances-for-employee.handler';
import { ListLeaveRequestsForEmployeeHandler } from './handlers/list-leave-requests-for-employee.handler';
import { ListLeaveTypesHandler } from './handlers/list-leave-types.handler';
import { RecordManualAttendanceHandler } from './handlers/record-manual-attendance.handler';
import { RejectLeaveRequestHandler } from './handlers/reject-leave-request.handler';
import { SubmitLeaveRequestHandler } from './handlers/submit-leave-request.handler';

export const HR_LEAVE_ATTENDANCE_COMMAND_HANDLERS = [
  CreateLeaveTypeHandler,
  AllocateLeaveBalanceHandler,
  SubmitLeaveRequestHandler,
  ApproveLeaveRequestHandler,
  RejectLeaveRequestHandler,
  CancelLeaveRequestHandler,
  ClockInHandler,
  ClockOutHandler,
  RecordManualAttendanceHandler,
];

export const HR_LEAVE_ATTENDANCE_QUERY_HANDLERS = [
  ListLeaveTypesHandler,
  ListLeaveBalancesForEmployeeHandler,
  ListLeaveRequestsForEmployeeHandler,
  GetAttendanceForEmployeeHandler,
];
