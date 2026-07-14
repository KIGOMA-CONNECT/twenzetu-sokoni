import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  BusinessRuleViolationException,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
} from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { StartWorkflowCommand, StartWorkflowResult } from '@abms/workflow-application';
import { WorkflowInstance } from '@abms/workflow-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmWorkflowDefinitionRepository } from '../repositories/typeorm-workflow-definition.repository';
import { TypeOrmWorkflowInstanceRepository } from '../repositories/typeorm-workflow-instance.repository';

@Injectable()
@CommandHandler(StartWorkflowCommand)
export class StartWorkflowHandler extends TransactionalCommandHandler<
  StartWorkflowCommand,
  StartWorkflowResult
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(
    command: StartWorkflowCommand,
    ctx: ITransactionContext,
  ): Promise<StartWorkflowResult> {
    const manager = getEntityManager(ctx);
    const definitionRepository = new TypeOrmWorkflowDefinitionRepository(manager);
    const instanceRepository = new TypeOrmWorkflowInstanceRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const definitionId = EntityId.create(command.workflowDefinitionId);
    const definition = await definitionRepository.findById(definitionId);
    if (!definition) {
      throw new NotFoundDomainException('WorkflowDefinition', command.workflowDefinitionId);
    }
    if (!definition.isActive) {
      throw new BusinessRuleViolationException(
        `Workflow definition "${definition.code}" is not active.`,
      );
    }

    const instance = WorkflowInstance.start({
      tenantId,
      workflowDefinitionId: definition.id,
      subjectType: command.subjectType,
      subjectId: command.subjectId,
      steps: definition.steps,
    });

    await instanceRepository.save(instance);
    for (const event of instance.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: instance.id.toValue() };
  }
}
