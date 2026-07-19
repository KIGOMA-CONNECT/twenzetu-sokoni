import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  BenefitEnrollmentReadModel,
  BenefitPlanReadModel,
  CancelBenefitEnrollmentCommand,
  CreateBenefitPlanCommand,
  CreateBenefitPlanResult,
  DeactivateBenefitPlanCommand,
  EnrollInBenefitCommand,
  EnrollInBenefitResult,
  ListBenefitEnrollmentsForEmployeeQuery,
  ListBenefitPlansQuery,
  ListSalaryRevisionsForEmployeeQuery,
  RecordSalaryRevisionCommand,
  RecordSalaryRevisionResult,
  SalaryRevisionReadModel,
} from '@abms/hr-compensation-application';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateBenefitPlanDto } from './dto/create-benefit-plan.dto';
import { EnrollInBenefitDto } from './dto/enroll-in-benefit.dto';
import { RecordSalaryRevisionDto } from './dto/record-salary-revision.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr/compensation')
@UseGuards(AuthGuard('jwt'))
export class CompensationController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('employees/:employeeId/salary-revisions')
  public recordSalaryRevision(
    @Param('employeeId') employeeId: string,
    @Body() dto: RecordSalaryRevisionDto,
  ): Promise<RecordSalaryRevisionResult> {
    return this.commandBus.execute(
      new RecordSalaryRevisionCommand(employeeId, dto.reason, dto.newBasicSalary, dto.effectiveDate),
    );
  }

  @Get('employees/:employeeId/salary-revisions')
  public listSalaryRevisionsForEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<SalaryRevisionReadModel[]> {
    return this.queryBus.execute(new ListSalaryRevisionsForEmployeeQuery(employeeId));
  }

  @Post('benefit-plans')
  public createBenefitPlan(@Body() dto: CreateBenefitPlanDto): Promise<CreateBenefitPlanResult> {
    return this.commandBus.execute(
      new CreateBenefitPlanCommand(dto.name, dto.benefitType, dto.employerContributionRateBasisPoints),
    );
  }

  @Get('benefit-plans')
  public listBenefitPlans(): Promise<BenefitPlanReadModel[]> {
    return this.queryBus.execute(new ListBenefitPlansQuery());
  }

  @Patch('benefit-plans/:id/deactivate')
  public deactivateBenefitPlan(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeactivateBenefitPlanCommand(id));
  }

  @Post('benefit-plans/:benefitPlanId/employees/:employeeId/enrollments')
  public enrollInBenefit(
    @Param('benefitPlanId') benefitPlanId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: EnrollInBenefitDto,
  ): Promise<EnrollInBenefitResult> {
    return this.commandBus.execute(new EnrollInBenefitCommand(employeeId, benefitPlanId, dto.effectiveDate));
  }

  @Get('employees/:employeeId/enrollments')
  public listBenefitEnrollmentsForEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<BenefitEnrollmentReadModel[]> {
    return this.queryBus.execute(new ListBenefitEnrollmentsForEmployeeQuery(employeeId));
  }

  @Patch('enrollments/:id/cancel')
  public cancelBenefitEnrollment(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CancelBenefitEnrollmentCommand(id));
  }
}
