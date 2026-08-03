import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  CancelOffboardingCommand,
  CompleteOffboardingCommand,
  CompleteOffboardingTaskCommand,
  GetOffboardingCaseByIdQuery,
  InitiateOffboardingCommand,
  InitiateOffboardingResult,
  ListOffboardingCasesQuery,
  ListOffboardingTasksForCaseQuery,
  OffboardingCaseReadModel,
  OffboardingTaskReadModel,
} from '@abms/hr-offboarding-application';
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InitiateOffboardingDto } from './dto/initiate-offboarding.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr/offboarding')
@UseGuards(AuthGuard('jwt'))
export class OffboardingController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('employees/:employeeId/cases')
  public initiateOffboarding(
    @Param('employeeId') employeeId: string,
    @Body() dto: InitiateOffboardingDto,
  ): Promise<InitiateOffboardingResult> {
    return this.commandBus.execute(
      new InitiateOffboardingCommand(employeeId, dto.exitReason, dto.lastWorkingDay),
    );
  }

  @Get('cases')
  public listOffboardingCases(): Promise<OffboardingCaseReadModel[]> {
    return this.queryBus.execute(new ListOffboardingCasesQuery());
  }

  @Get('cases/:id')
  public async getOffboardingCaseById(@Param('id') id: string): Promise<OffboardingCaseReadModel> {
    const offboardingCase = await this.queryBus.execute(new GetOffboardingCaseByIdQuery(id));
    if (!offboardingCase) {
      throw new NotFoundException(`Offboarding case "${id}" was not found.`);
    }
    return offboardingCase;
  }

  @Patch('cases/:id/complete')
  public completeOffboarding(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CompleteOffboardingCommand(id));
  }

  @Patch('cases/:id/cancel')
  public cancelOffboarding(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CancelOffboardingCommand(id));
  }

  @Get('cases/:id/tasks')
  public listOffboardingTasksForCase(@Param('id') id: string): Promise<OffboardingTaskReadModel[]> {
    return this.queryBus.execute(new ListOffboardingTasksForCaseQuery(id));
  }

  @Patch('tasks/:id/complete')
  public completeOffboardingTask(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new CompleteOffboardingTaskCommand(id));
  }
}
