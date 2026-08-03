import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  ApprovePayslipCommand,
  ClosePayrollPeriodCommand,
  GeneratePayslipCommand,
  GeneratePayslipResult,
  GetActiveSalaryStructureForEmployeeQuery,
  GetPayslipByIdQuery,
  ListPayrollPeriodsQuery,
  ListPayslipsForEmployeeQuery,
  ListPayslipsForPeriodQuery,
  MarkPayslipPaidCommand,
  OpenPayrollPeriodCommand,
  OpenPayrollPeriodResult,
  PayrollPeriodReadModel,
  PayslipReadModel,
  SalaryStructureReadModel,
  SetSalaryStructureCommand,
  SetSalaryStructureResult,
} from '@abms/hr-payroll-application';
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OpenPayrollPeriodDto } from './dto/open-payroll-period.dto';
import { SetSalaryStructureDto } from './dto/set-salary-structure.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr/payroll')
@UseGuards(AuthGuard('jwt'))
export class PayrollController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('employees/:employeeId/salary-structure')
  public setSalaryStructure(
    @Param('employeeId') employeeId: string,
    @Body() dto: SetSalaryStructureDto,
  ): Promise<SetSalaryStructureResult> {
    return this.commandBus.execute(
      new SetSalaryStructureCommand(employeeId, dto.basicSalary, dto.allowances, dto.effectiveFrom),
    );
  }

  @Get('employees/:employeeId/salary-structure')
  public async getActiveSalaryStructure(
    @Param('employeeId') employeeId: string,
  ): Promise<SalaryStructureReadModel> {
    const structure = await this.queryBus.execute(
      new GetActiveSalaryStructureForEmployeeQuery(employeeId),
    );
    if (!structure) {
      throw new NotFoundException(`No active salary structure for employee "${employeeId}".`);
    }
    return structure;
  }

  @Post('periods')
  public openPeriod(@Body() dto: OpenPayrollPeriodDto): Promise<OpenPayrollPeriodResult> {
    return this.commandBus.execute(new OpenPayrollPeriodCommand(dto.year, dto.month));
  }

  @Get('periods')
  public listPeriods(): Promise<PayrollPeriodReadModel[]> {
    return this.queryBus.execute(new ListPayrollPeriodsQuery());
  }

  @Patch('periods/:id/close')
  public closePeriod(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new ClosePayrollPeriodCommand(id));
  }

  @Post('periods/:periodId/payslips/:employeeId')
  public generatePayslip(
    @Param('periodId') periodId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<GeneratePayslipResult> {
    return this.commandBus.execute(new GeneratePayslipCommand(periodId, employeeId));
  }

  @Get('periods/:periodId/payslips')
  public listPayslipsForPeriod(@Param('periodId') periodId: string): Promise<PayslipReadModel[]> {
    return this.queryBus.execute(new ListPayslipsForPeriodQuery(periodId));
  }

  @Get('employees/:employeeId/payslips')
  public listPayslipsForEmployee(@Param('employeeId') employeeId: string): Promise<PayslipReadModel[]> {
    return this.queryBus.execute(new ListPayslipsForEmployeeQuery(employeeId));
  }

  @Get('payslips/:id')
  public async getPayslipById(@Param('id') id: string): Promise<PayslipReadModel> {
    const payslip = await this.queryBus.execute(new GetPayslipByIdQuery(id));
    if (!payslip) {
      throw new NotFoundException(`Payslip "${id}" was not found.`);
    }
    return payslip;
  }

  @Patch('payslips/:id/approve')
  public approvePayslip(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new ApprovePayslipCommand(id));
  }

  @Patch('payslips/:id/mark-paid')
  public markPayslipPaid(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new MarkPayslipPaidCommand(id));
  }
}
