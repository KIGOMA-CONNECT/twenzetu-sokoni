import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  AdvanceToInterviewingCommand,
  AdvanceToScreeningCommand,
  ApplicationReadModel,
  CandidateReadModel,
  CloseJobRequisitionCommand,
  CompleteOnboardingTaskCommand,
  GetApplicationByIdQuery,
  HireCandidateCommand,
  HireCandidateResult,
  JobRequisitionReadModel,
  ListApplicationsForCandidateQuery,
  ListApplicationsForRequisitionQuery,
  ListCandidatesQuery,
  ListJobRequisitionsQuery,
  ListOnboardingTasksForEmployeeQuery,
  MakeOfferCommand,
  OnboardingTaskReadModel,
  OpenJobRequisitionCommand,
  OpenJobRequisitionResult,
  RegisterCandidateCommand,
  RegisterCandidateResult,
  RejectApplicationCommand,
  SubmitApplicationCommand,
  SubmitApplicationResult,
  WithdrawApplicationCommand,
} from '@abms/hr-recruitment-application';
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CloseJobRequisitionDto } from './dto/close-job-requisition.dto';
import { HireCandidateDto } from './dto/hire-candidate.dto';
import { OpenJobRequisitionDto } from './dto/open-job-requisition.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { SubmitApplicationDto } from './dto/submit-application.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr/recruitment')
@UseGuards(AuthGuard('jwt'))
export class RecruitmentController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('job-requisitions')
  public openJobRequisition(@Body() dto: OpenJobRequisitionDto): Promise<OpenJobRequisitionResult> {
    return this.commandBus.execute(
      new OpenJobRequisitionCommand(dto.positionId, dto.title, dto.headcount),
    );
  }

  @Get('job-requisitions')
  public listJobRequisitions(): Promise<JobRequisitionReadModel[]> {
    return this.queryBus.execute(new ListJobRequisitionsQuery());
  }

  @Patch('job-requisitions/:id/close')
  public closeJobRequisition(
    @Param('id') id: string,
    @Body() dto: CloseJobRequisitionDto,
  ): Promise<void> {
    return this.commandBus.execute(new CloseJobRequisitionCommand(id, dto.reason));
  }

  @Get('job-requisitions/:id/applications')
  public listApplicationsForRequisition(@Param('id') id: string): Promise<ApplicationReadModel[]> {
    return this.queryBus.execute(new ListApplicationsForRequisitionQuery(id));
  }

  @Post('candidates')
  public registerCandidate(@Body() dto: RegisterCandidateDto): Promise<RegisterCandidateResult> {
    return this.commandBus.execute(
      new RegisterCandidateCommand(dto.firstName, dto.lastName, dto.email, dto.phone, dto.resumeUrl, dto.source),
    );
  }

  @Get('candidates')
  public listCandidates(): Promise<CandidateReadModel[]> {
    return this.queryBus.execute(new ListCandidatesQuery());
  }

  @Get('candidates/:id/applications')
  public listApplicationsForCandidate(@Param('id') id: string): Promise<ApplicationReadModel[]> {
    return this.queryBus.execute(new ListApplicationsForCandidateQuery(id));
  }

  @Post('applications')
  public submitApplication(@Body() dto: SubmitApplicationDto): Promise<SubmitApplicationResult> {
    return this.commandBus.execute(
      new SubmitApplicationCommand(dto.candidateId, dto.jobRequisitionId),
    );
  }

  @Get('applications/:id')
  public async getApplicationById(@Param('id') id: string): Promise<ApplicationReadModel> {
    const application = await this.queryBus.execute(new GetApplicationByIdQuery(id));
    if (!application) {
      throw new NotFoundException(`Application "${id}" was not found.`);
    }
    return application;
  }

  @Patch('applications/:id/advance-to-screening')
  public advanceToScreening(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new AdvanceToScreeningCommand(id));
  }

  @Patch('applications/:id/advance-to-interviewing')
  public advanceToInterviewing(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new AdvanceToInterviewingCommand(id));
  }

  @Patch('applications/:id/make-offer')
  public makeOffer(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new MakeOfferCommand(id));
  }

  @Patch('applications/:id/hire')
  public hireCandidate(@Param('id') id: string, @Body() dto: HireCandidateDto): Promise<HireCandidateResult> {
    return this.commandBus.execute(
      new HireCandidateCommand(id, dto.employeeNumber, dto.hireDate, dto.employmentType, dto.orgUnitId),
    );
  }

  @Patch('applications/:id/reject')
  public rejectApplication(@Param('id') id: string, @Body() dto: RejectApplicationDto): Promise<void> {
    return this.commandBus.execute(new RejectApplicationCommand(id, dto.reason));
  }

  @Patch('applications/:id/withdraw')
  public withdrawApplication(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new WithdrawApplicationCommand(id));
  }

  @Get('employees/:employeeId/onboarding-tasks')
  public listOnboardingTasks(@Param('employeeId') employeeId: string): Promise<OnboardingTaskReadModel[]> {
    return this.queryBus.execute(new ListOnboardingTasksForEmployeeQuery(employeeId));
  }

  @Patch('onboarding-tasks/:id/complete')
  public completeOnboardingTask(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CompleteOnboardingTaskCommand(id));
  }
}
