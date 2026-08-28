import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkflowService } from './workflow.service';

@Controller('workflow')
@UseGuards(AuthGuard('jwt'))
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('workflows')
  async createWorkflow(
    @Body() dto: {
      name: string;
      description?: string;
      entityType: string;
      steps: Array<{
        name: string;
        stepType: string;
        assigneeRole: string;
        order: number;
        isRequired?: boolean;
        timeoutHours?: number;
        conditions?: Record<string, unknown>;
      }>;
    },
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const workflow = await this.workflowService.createWorkflow(tenantId, dto);
    return { success: true, data: workflow };
  }

  @Get('workflows')
  async getWorkflows(
    @Query('entityType') entityType: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const workflows = await this.workflowService.getWorkflows(tenantId, entityType);
    return { success: true, data: workflows };
  }

  @Get('workflows/:id')
  async getWorkflowById(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const workflow = await this.workflowService.getWorkflowById(id, tenantId);
    return { success: true, data: workflow };
  }

  @Patch('workflows/:id/status')
  async updateWorkflowStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const workflow = await this.workflowService.updateWorkflowStatus(id, tenantId, status);
    return { success: true, data: workflow };
  }

  @Post('instances')
  async startInstance(
    @Body() dto: {
      workflowId: string;
      entityType: string;
      entityId: string;
      initiatedBy: string;
      data?: Record<string, unknown>;
    },
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const instance = await this.workflowService.startInstance(tenantId, dto);
    return { success: true, data: instance };
  }

  @Get('instances')
  async getInstances(
    @Query('workflowId') workflowId: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const instances = await this.workflowService.getInstances(tenantId, workflowId);
    return { success: true, data: instances };
  }

  @Post('instances/:id/advance')
  async advanceInstance(
    @Param('id') id: string,
    @Body() dto: {
      stepName: string;
      action: string;
      performedBy: string;
      comment?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const instance = await this.workflowService.advanceInstance(id, tenantId, dto);
    return { success: true, data: instance };
  }

  @Post('instances/:id/cancel')
  async cancelInstance(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const instance = await this.workflowService.cancelInstance(id, tenantId);
    return { success: true, data: instance };
  }
}
