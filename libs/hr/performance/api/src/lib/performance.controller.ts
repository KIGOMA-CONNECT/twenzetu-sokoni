import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  AcknowledgePerformanceReviewCommand,
  CancelGoalCommand,
  CloseReviewCycleCommand,
  CompleteGoalCommand,
  GetPerformanceReviewByIdQuery,
  GoalReadModel,
  ListGoalsForEmployeeQuery,
  ListPerformanceReviewsForCycleQuery,
  ListPerformanceReviewsForEmployeeQuery,
  ListReviewCyclesQuery,
  OpenReviewCycleCommand,
  OpenReviewCycleResult,
  PerformanceReviewReadModel,
  ReviewCycleReadModel,
  SetGoalCommand,
  SetGoalResult,
  StartPerformanceReviewCommand,
  StartPerformanceReviewResult,
  SubmitPerformanceReviewCommand,
  UpdateGoalProgressCommand,
} from '@abms/hr-performance-application';
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OpenReviewCycleDto } from './dto/open-review-cycle.dto';
import { SetGoalDto } from './dto/set-goal.dto';
import { StartPerformanceReviewDto } from './dto/start-performance-review.dto';
import { SubmitPerformanceReviewDto } from './dto/submit-performance-review.dto';
import { UpdateGoalProgressDto } from './dto/update-goal-progress.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr/performance')
@UseGuards(AuthGuard('jwt'))
export class PerformanceController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('employees/:employeeId/goals')
  public setGoal(
    @Param('employeeId') employeeId: string,
    @Body() dto: SetGoalDto,
  ): Promise<SetGoalResult> {
    return this.commandBus.execute(
      new SetGoalCommand(employeeId, dto.title, dto.targetDate, dto.description ?? null),
    );
  }

  @Get('employees/:employeeId/goals')
  public listGoalsForEmployee(@Param('employeeId') employeeId: string): Promise<GoalReadModel[]> {
    return this.queryBus.execute(new ListGoalsForEmployeeQuery(employeeId));
  }

  @Patch('goals/:id/progress')
  public updateGoalProgress(@Param('id') id: string, @Body() dto: UpdateGoalProgressDto): Promise<void> {
    return this.commandBus.execute(new UpdateGoalProgressCommand(id, dto.progressPercent));
  }

  @Patch('goals/:id/complete')
  public completeGoal(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CompleteGoalCommand(id));
  }

  @Patch('goals/:id/cancel')
  public cancelGoal(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CancelGoalCommand(id));
  }

  @Post('review-cycles')
  public openReviewCycle(@Body() dto: OpenReviewCycleDto): Promise<OpenReviewCycleResult> {
    return this.commandBus.execute(new OpenReviewCycleCommand(dto.name, dto.startDate, dto.endDate));
  }

  @Get('review-cycles')
  public listReviewCycles(): Promise<ReviewCycleReadModel[]> {
    return this.queryBus.execute(new ListReviewCyclesQuery());
  }

  @Patch('review-cycles/:id/close')
  public closeReviewCycle(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CloseReviewCycleCommand(id));
  }

  @Post('review-cycles/:reviewCycleId/reviews')
  public startPerformanceReview(
    @Param('reviewCycleId') reviewCycleId: string,
    @Body() dto: StartPerformanceReviewDto,
  ): Promise<StartPerformanceReviewResult> {
    return this.commandBus.execute(new StartPerformanceReviewCommand(dto.employeeId, reviewCycleId));
  }

  @Get('review-cycles/:reviewCycleId/reviews')
  public listPerformanceReviewsForCycle(
    @Param('reviewCycleId') reviewCycleId: string,
  ): Promise<PerformanceReviewReadModel[]> {
    return this.queryBus.execute(new ListPerformanceReviewsForCycleQuery(reviewCycleId));
  }

  @Get('employees/:employeeId/reviews')
  public listPerformanceReviewsForEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<PerformanceReviewReadModel[]> {
    return this.queryBus.execute(new ListPerformanceReviewsForEmployeeQuery(employeeId));
  }

  @Get('reviews/:id')
  public async getPerformanceReviewById(@Param('id') id: string): Promise<PerformanceReviewReadModel> {
    const review = await this.queryBus.execute(new GetPerformanceReviewByIdQuery(id));
    if (!review) {
      throw new NotFoundException(`Performance review "${id}" was not found.`);
    }
    return review;
  }

  @Patch('reviews/:id/submit')
  public submitPerformanceReview(
    @Param('id') id: string,
    @Body() dto: SubmitPerformanceReviewDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new SubmitPerformanceReviewCommand(id, dto.rating, dto.comments ?? null),
    );
  }

  @Patch('reviews/:id/acknowledge')
  public acknowledgePerformanceReview(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new AcknowledgePerformanceReviewCommand(id));
  }
}
