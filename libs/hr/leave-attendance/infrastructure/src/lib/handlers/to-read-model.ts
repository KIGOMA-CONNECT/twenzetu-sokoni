import {
  AttendanceRecordReadModel,
  LeaveBalanceReadModel,
  LeaveRequestReadModel,
  LeaveTypeReadModel,
} from '@abms/hr-leave-attendance-application';
import { AttendanceRecord, LeaveBalance, LeaveRequest, LeaveType } from '@abms/hr-leave-attendance-domain';

export function toLeaveTypeReadModel(leaveType: LeaveType): LeaveTypeReadModel {
  return {
    id: leaveType.id.toValue(),
    code: leaveType.code,
    name: leaveType.name,
    defaultDaysPerYear: leaveType.defaultDaysPerYear,
    requiresApproval: leaveType.requiresApproval,
    isActive: leaveType.isActive,
  };
}

export function toLeaveBalanceReadModel(balance: LeaveBalance): LeaveBalanceReadModel {
  return {
    id: balance.id.toValue(),
    employeeId: balance.employeeId.toValue(),
    leaveTypeId: balance.leaveTypeId.toValue(),
    year: balance.year,
    allocatedDays: balance.allocatedDays,
    usedDays: balance.usedDays,
    remainingDays: balance.remainingDays,
  };
}

export function toLeaveRequestReadModel(request: LeaveRequest): LeaveRequestReadModel {
  return {
    id: request.id.toValue(),
    employeeId: request.employeeId.toValue(),
    leaveTypeId: request.leaveTypeId.toValue(),
    startDate: request.startDate.toISOString().slice(0, 10),
    endDate: request.endDate.toISOString().slice(0, 10),
    numberOfDays: request.numberOfDays,
    reason: request.reason,
    status: request.status,
    decidedByUserId: request.decidedByUserId,
    decidedAt: request.decidedAt?.toISOString() ?? null,
    comment: request.comment,
    version: request.version,
  };
}

export function toAttendanceRecordReadModel(record: AttendanceRecord): AttendanceRecordReadModel {
  return {
    id: record.id.toValue(),
    employeeId: record.employeeId.toValue(),
    date: record.date.toISOString().slice(0, 10),
    clockInTime: record.clockInTime?.toISOString() ?? null,
    clockOutTime: record.clockOutTime?.toISOString() ?? null,
    status: record.status,
    hoursWorked: record.hoursWorked,
  };
}
