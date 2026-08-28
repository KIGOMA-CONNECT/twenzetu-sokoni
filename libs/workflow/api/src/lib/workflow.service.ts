import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowOrmEntity } from '@abms/workflow-infrastructure';
import { WorkflowInstanceOrmEntity } from '@abms/workflow-infrastructure';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(WorkflowOrmEntity)
    private readonly workflowRepo: Repository<WorkflowOrmEntity>,
    @InjectRepository(WorkflowInstanceOrmEntity)
    private readonly instanceRepo: Repository<WorkflowInstanceOrmEntity>,
  ) {}

  async createWorkflow(tenantId: string, dto: {
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
  }): Promise<WorkflowOrmEntity> {
    const entity = this.workflowRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      entityType: dto.entityType,
      steps: dto.steps,
      status: 'DRAFT',
      tenantId,
    });
    return this.workflowRepo.save(entity);
  }

  async getWorkflows(tenantId: string, entityType?: string): Promise<WorkflowOrmEntity[]> {
    const where: Record<string, unknown> = { tenantId };
    if (entityType) {
      where.entityType = entityType;
    }
    return this.workflowRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getWorkflowById(id: string, tenantId: string): Promise<WorkflowOrmEntity> {
    const workflow = await this.workflowRepo.findOne({ where: { id, tenantId } });
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async updateWorkflowStatus(id: string, tenantId: string, status: string): Promise<WorkflowOrmEntity> {
    const workflow = await this.getWorkflowById(id, tenantId);
    const validStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    workflow.status = status;
    return this.workflowRepo.save(workflow);
  }

  async startInstance(tenantId: string, dto: {
    workflowId: string;
    entityType: string;
    entityId: string;
    initiatedBy: string;
    data?: Record<string, unknown>;
  }): Promise<WorkflowInstanceOrmEntity> {
    const workflow = await this.getWorkflowById(dto.workflowId, tenantId);
    if (workflow.status !== 'ACTIVE') {
      throw new BadRequestException('Workflow must be ACTIVE to start an instance');
    }

    const entity = this.instanceRepo.create({
      workflowId: dto.workflowId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      initiatedBy: dto.initiatedBy,
      data: dto.data ?? {},
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      actions: [],
      tenantId,
    });
    return this.instanceRepo.save(entity);
  }

  async getInstances(tenantId: string, workflowId?: string): Promise<WorkflowInstanceOrmEntity[]> {
    const where: Record<string, unknown> = { tenantId };
    if (workflowId) {
      where.workflowId = workflowId;
    }
    return this.instanceRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async advanceInstance(instanceId: string, tenantId: string, action: {
    stepName: string;
    action: string;
    performedBy: string;
    comment?: string;
  }): Promise<WorkflowInstanceOrmEntity> {
    const instance = await this.instanceRepo.findOne({ where: { id: instanceId, tenantId } });
    if (!instance) {
      throw new NotFoundException(`Workflow instance ${instanceId} not found`);
    }
    if (instance.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Workflow instance is not in progress');
    }

    const workflow = await this.getWorkflowById(instance.workflowId, tenantId);
    const currentStep = workflow.steps[instance.currentStepIndex];
    if (!currentStep) {
      throw new BadRequestException('No current step found for this instance');
    }
    if (currentStep.name !== action.stepName) {
      throw new BadRequestException(`Expected step "${currentStep.name}" but got "${action.stepName}"`);
    }

    const validActions = ['APPROVE', 'REJECT', 'SKIP'];
    if (!validActions.includes(action.action)) {
      throw new BadRequestException(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    const actionRecord = {
      stepName: action.stepName,
      action: action.action,
      performedBy: action.performedBy,
      comment: action.comment,
      performedAt: new Date(),
    };

    instance.actions = [...instance.actions, actionRecord];

    if (action.action === 'REJECT') {
      instance.status = 'REJECTED';
      instance.completedAt = new Date();
    } else if (action.action === 'APPROVE' || action.action === 'SKIP') {
      instance.currentStepIndex++;
      if (instance.currentStepIndex >= workflow.steps.length) {
        instance.status = 'COMPLETED';
        instance.completedAt = new Date();
      }
    }

    return this.instanceRepo.save(instance);
  }

  async cancelInstance(instanceId: string, tenantId: string): Promise<WorkflowInstanceOrmEntity> {
    const instance = await this.instanceRepo.findOne({ where: { id: instanceId, tenantId } });
    if (!instance) {
      throw new NotFoundException(`Workflow instance ${instanceId} not found`);
    }
    if (instance.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Can only cancel an in-progress instance');
    }
    instance.status = 'CANCELLED';
    instance.completedAt = new Date();
    return this.instanceRepo.save(instance);
  }
}
