import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  ApproveStepCommand,
  CreateWorkflowDefinitionCommand,
  CreateWorkflowDefinitionResult,
  GetWorkflowInstanceByIdQuery,
  ListWorkflowDefinitionsQuery,
  RejectStepCommand,
  StartWorkflowCommand,
  StartWorkflowResult,
  WorkflowDefinitionReadModel,
  WorkflowInstanceReadModel,
} from '@abms/workflow-application';
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ApproveStepDto } from './dto/approve-step.dto';
import { CreateWorkflowDefinitionDto } from './dto/create-workflow-definition.dto';
import { RejectStepDto } from './dto/reject-step.dto';
import { StartWorkflowDto } from './dto/start-workflow.dto';

// Deliberately not identity's AuthenticatedRequestUser type — libs/workflow is
// foundation-tier and must not depend on the bounded-context identity module
// (which itself depends on workflow). AuthGuard('jwt') is the generic
// @nestjs/passport factory (looked up by strategy name against the process-wide
// Passport registry), so using it here creates no Nx dependency edge either.
// See ADR-0007 and OrganizationController for the identical reasoning.
interface CurrentUser {
  readonly userId: string;
  readonly role: string;
}

@Controller('workflows')
@UseGuards(AuthGuard('jwt'))
export class WorkflowController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('definitions')
  public createDefinition(
    @Body() dto: CreateWorkflowDefinitionDto,
  ): Promise<CreateWorkflowDefinitionResult> {
    return this.commandBus.execute(
      new CreateWorkflowDefinitionCommand(dto.code, dto.name, dto.approverRoles),
    );
  }

  @Get('definitions')
  public listDefinitions(): Promise<WorkflowDefinitionReadModel[]> {
    return this.queryBus.execute(new ListWorkflowDefinitionsQuery());
  }

  @Post('instances')
  public startInstance(@Body() dto: StartWorkflowDto): Promise<StartWorkflowResult> {
    return this.commandBus.execute(
      new StartWorkflowCommand(dto.workflowDefinitionId, dto.subjectType, dto.subjectId),
    );
  }

  @Get('instances/:id')
  public async getInstanceById(@Param('id') id: string): Promise<WorkflowInstanceReadModel> {
    const instance = await this.queryBus.execute(new GetWorkflowInstanceByIdQuery(id));
    if (!instance) {
      throw new NotFoundException(`Workflow instance "${id}" was not found.`);
    }
    return instance;
  }

  @Patch('instances/:id/approve')
  public approveStep(
    @Req() request: Request & { user: CurrentUser },
    @Param('id') id: string,
    @Body() dto: ApproveStepDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new ApproveStepCommand(id, dto.stepOrder, request.user.userId, request.user.role, dto.comment ?? null),
    );
  }

  @Patch('instances/:id/reject')
  public rejectStep(
    @Req() request: Request & { user: CurrentUser },
    @Param('id') id: string,
    @Body() dto: RejectStepDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new RejectStepCommand(id, dto.stepOrder, request.user.userId, request.user.role, dto.comment ?? null),
    );
  }
}
