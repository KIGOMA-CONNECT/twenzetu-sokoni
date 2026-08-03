import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  CloseSuccessionPlanCommand,
  ListCandidatesForPlanQuery,
  ListSuccessionPlansQuery,
  NominateSuccessionCandidateCommand,
  NominateSuccessionCandidateResult,
  OpenSuccessionPlanCommand,
  OpenSuccessionPlanResult,
  RemoveSuccessionCandidateCommand,
  SuccessionCandidateReadModel,
  SuccessionPlanReadModel,
  UpdateCandidateReadinessCommand,
} from '@abms/hr-succession-application';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NominateSuccessionCandidateDto } from './dto/nominate-succession-candidate.dto';
import { OpenSuccessionPlanDto } from './dto/open-succession-plan.dto';
import { UpdateCandidateReadinessDto } from './dto/update-candidate-readiness.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr/succession')
@UseGuards(AuthGuard('jwt'))
export class SuccessionController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('positions/:positionId/plans')
  public openSuccessionPlan(
    @Param('positionId') positionId: string,
    @Body() dto: OpenSuccessionPlanDto,
  ): Promise<OpenSuccessionPlanResult> {
    return this.commandBus.execute(new OpenSuccessionPlanCommand(positionId, dto.notes ?? null));
  }

  @Get('plans')
  public listSuccessionPlans(): Promise<SuccessionPlanReadModel[]> {
    return this.queryBus.execute(new ListSuccessionPlansQuery());
  }

  @Patch('plans/:id/close')
  public closeSuccessionPlan(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CloseSuccessionPlanCommand(id));
  }

  @Post('plans/:planId/employees/:employeeId/candidates')
  public nominateSuccessionCandidate(
    @Param('planId') planId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: NominateSuccessionCandidateDto,
  ): Promise<NominateSuccessionCandidateResult> {
    return this.commandBus.execute(
      new NominateSuccessionCandidateCommand(planId, employeeId, dto.readinessLevel, dto.notes ?? null),
    );
  }

  @Get('plans/:planId/candidates')
  public listCandidatesForPlan(@Param('planId') planId: string): Promise<SuccessionCandidateReadModel[]> {
    return this.queryBus.execute(new ListCandidatesForPlanQuery(planId));
  }

  @Patch('candidates/:id/readiness')
  public updateCandidateReadiness(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateReadinessDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateCandidateReadinessCommand(id, dto.readinessLevel, dto.notes ?? null),
    );
  }

  @Delete('candidates/:id')
  public removeSuccessionCandidate(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new RemoveSuccessionCandidateCommand(id));
  }
}
