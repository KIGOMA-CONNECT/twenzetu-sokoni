import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  AssignComplianceRequirementCommand,
  AssignComplianceRequirementResult,
  ComplianceRequirementReadModel,
  CreateComplianceRequirementCommand,
  CreateComplianceRequirementResult,
  DeactivateComplianceRequirementCommand,
  EmployeeComplianceRecordReadModel,
  ListComplianceRecordsForEmployeeQuery,
  ListComplianceRecordsForRequirementQuery,
  ListComplianceRequirementsQuery,
  MarkComplianceRecordCompliantCommand,
  MarkComplianceRecordExemptCommand,
  MarkComplianceRecordOverdueCommand,
} from '@abms/hr-compliance-application';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssignComplianceRequirementDto } from './dto/assign-compliance-requirement.dto';
import { CreateComplianceRequirementDto } from './dto/create-compliance-requirement.dto';
import { MarkComplianceRecordCompliantDto } from './dto/mark-compliance-record-compliant.dto';
import { MarkComplianceRecordExemptDto } from './dto/mark-compliance-record-exempt.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr/compliance')
@UseGuards(AuthGuard('jwt'))
export class ComplianceController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('requirements')
  public createRequirement(
    @Body() dto: CreateComplianceRequirementDto,
  ): Promise<CreateComplianceRequirementResult> {
    return this.commandBus.execute(
      new CreateComplianceRequirementCommand(dto.name, dto.category, dto.recurrence, dto.description ?? null),
    );
  }

  @Get('requirements')
  public listRequirements(): Promise<ComplianceRequirementReadModel[]> {
    return this.queryBus.execute(new ListComplianceRequirementsQuery());
  }

  @Patch('requirements/:id/deactivate')
  public deactivateRequirement(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeactivateComplianceRequirementCommand(id));
  }

  @Get('requirements/:requirementId/records')
  public listRecordsForRequirement(
    @Param('requirementId') requirementId: string,
  ): Promise<EmployeeComplianceRecordReadModel[]> {
    return this.queryBus.execute(new ListComplianceRecordsForRequirementQuery(requirementId));
  }

  @Post('requirements/:requirementId/employees/:employeeId/records')
  public assignRequirement(
    @Param('requirementId') requirementId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: AssignComplianceRequirementDto,
  ): Promise<AssignComplianceRequirementResult> {
    return this.commandBus.execute(
      new AssignComplianceRequirementCommand(employeeId, requirementId, dto.dueDate),
    );
  }

  @Get('employees/:employeeId/records')
  public listRecordsForEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<EmployeeComplianceRecordReadModel[]> {
    return this.queryBus.execute(new ListComplianceRecordsForEmployeeQuery(employeeId));
  }

  @Patch('records/:id/mark-compliant')
  public markCompliant(
    @Param('id') id: string,
    @Body() dto: MarkComplianceRecordCompliantDto,
  ): Promise<void> {
    return this.commandBus.execute(new MarkComplianceRecordCompliantCommand(id, dto.completedDate));
  }

  @Patch('records/:id/mark-overdue')
  public markOverdue(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new MarkComplianceRecordOverdueCommand(id));
  }

  @Patch('records/:id/mark-exempt')
  public markExempt(@Param('id') id: string, @Body() dto: MarkComplianceRecordExemptDto): Promise<void> {
    return this.commandBus.execute(new MarkComplianceRecordExemptCommand(id, dto.reason));
  }
}
