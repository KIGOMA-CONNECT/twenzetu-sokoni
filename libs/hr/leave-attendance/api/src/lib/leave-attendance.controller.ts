import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  AllocateLeaveBalanceCommand,
  AllocateLeaveBalanceResult,
  ApproveLeaveRequestCommand,
  AttendanceRecordReadModel,
  CancelLeaveRequestCommand,
  ClockInCommand,
  ClockInResult,
  ClockOutCommand,
  CreateLeaveTypeCommand,
  CreateLeaveTypeResult,
  GetAttendanceForEmployeeQuery,
  LeaveBalanceReadModel,
  LeaveRequestReadModel,
  LeaveTypeReadModel,
  ListLeaveBalancesForEmployeeQuery,
  ListLeaveRequestsForEmployeeQuery,
  ListLeaveTypesQuery,
  RecordManualAttendanceCommand,
  RecordManualAttendanceResult,
  RejectLeaveRequestCommand,
  SubmitLeaveRequestCommand,
  SubmitLeaveRequestResult,
} from '@abms/hr-leave-attendance-application';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AllocateLeaveBalanceDto } from './dto/allocate-leave-balance.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { LeaveRequestDecisionDto } from './dto/leave-request-decision.dto';
import { RecordManualAttendanceDto } from './dto/record-manual-attendance.dto';
import { SubmitLeaveRequestDto } from './dto/submit-leave-request.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr')
@UseGuards(AuthGuard('jwt'))
export class LeaveAttendanceController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('leave-types')
  public createLeaveType(@Body() dto: CreateLeaveTypeDto): Promise<CreateLeaveTypeResult> {
    return this.commandBus.execute(
      new CreateLeaveTypeCommand(dto.code, dto.name, dto.defaultDaysPerYear, dto.requiresApproval),
    );
  }

  @Get('leave-types')
  public listLeaveTypes(): Promise<LeaveTypeReadModel[]> {
    return this.queryBus.execute(new ListLeaveTypesQuery());
  }

  @Post('employees/:employeeId/leave-balances')
  public allocateLeaveBalance(
    @Param('employeeId') employeeId: string,
    @Body() dto: AllocateLeaveBalanceDto,
  ): Promise<AllocateLeaveBalanceResult> {
    return this.commandBus.execute(
      new AllocateLeaveBalanceCommand(employeeId, dto.leaveTypeId, dto.year, dto.allocatedDays),
    );
  }

  @Get('employees/:employeeId/leave-balances')
  public listLeaveBalances(
    @Param('employeeId') employeeId: string,
    @Query('year') year: string,
  ): Promise<LeaveBalanceReadModel[]> {
    return this.queryBus.execute(new ListLeaveBalancesForEmployeeQuery(employeeId, Number(year)));
  }

  @Post('employees/:employeeId/leave-requests')
  public submitLeaveRequest(
    @Param('employeeId') employeeId: string,
    @Body() dto: SubmitLeaveRequestDto,
  ): Promise<SubmitLeaveRequestResult> {
    return this.commandBus.execute(
      new SubmitLeaveRequestCommand(
        employeeId,
        dto.leaveTypeId,
        dto.startDate,
        dto.endDate,
        dto.numberOfDays,
        dto.reason,
      ),
    );
  }

  @Get('employees/:employeeId/leave-requests')
  public listLeaveRequests(@Param('employeeId') employeeId: string): Promise<LeaveRequestReadModel[]> {
    return this.queryBus.execute(new ListLeaveRequestsForEmployeeQuery(employeeId));
  }

  @Patch('leave-requests/:id/approve')
  public approveLeaveRequest(@Param('id') id: string, @Body() dto: LeaveRequestDecisionDto): Promise<void> {
    return this.commandBus.execute(new ApproveLeaveRequestCommand(id, dto.comment));
  }

  @Patch('leave-requests/:id/reject')
  public rejectLeaveRequest(@Param('id') id: string, @Body() dto: LeaveRequestDecisionDto): Promise<void> {
    return this.commandBus.execute(new RejectLeaveRequestCommand(id, dto.comment));
  }

  @Patch('leave-requests/:id/cancel')
  public cancelLeaveRequest(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CancelLeaveRequestCommand(id));
  }

  @Post('employees/:employeeId/attendance/clock-in')
  public clockIn(@Param('employeeId') employeeId: string): Promise<ClockInResult> {
    return this.commandBus.execute(new ClockInCommand(employeeId));
  }

  @Patch('attendance/:id/clock-out')
  public clockOut(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new ClockOutCommand(id));
  }

  @Post('employees/:employeeId/attendance/manual')
  public recordManualAttendance(
    @Param('employeeId') employeeId: string,
    @Body() dto: RecordManualAttendanceDto,
  ): Promise<RecordManualAttendanceResult> {
    return this.commandBus.execute(new RecordManualAttendanceCommand(employeeId, dto.date, dto.status));
  }

  @Get('employees/:employeeId/attendance')
  public getAttendance(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<AttendanceRecordReadModel[]> {
    return this.queryBus.execute(new GetAttendanceForEmployeeQuery(employeeId, startDate, endDate));
  }
}
