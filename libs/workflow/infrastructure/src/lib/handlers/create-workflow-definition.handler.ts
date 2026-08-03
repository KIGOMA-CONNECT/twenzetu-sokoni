import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  CreateWorkflowDefinitionCommand,
  CreateWorkflowDefinitionResult,
} from '@abms/workflow-application';
import { WorkflowDefinition } from '@abms/workflow-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmWorkflowDefinitionRepository } from '../repositories/typeorm-workflow-definition.repository';

@Injectable()
@CommandHandler(CreateWorkflowDefinitionCommand)
export class CreateWorkflowDefinitionHandler extends TransactionalCommandHandler<
  CreateWorkflowDefinitionCommand,
  CreateWorkflowDefinitionResult
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
    command: CreateWorkflowDefinitionCommand,
    ctx: ITransactionContext,
  ): Promise<CreateWorkflowDefinitionResult> {
    const repository = new TypeOrmWorkflowDefinitionRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const existing = await repository.findByCode(tenantId, command.code);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A workflow definition with code "${command.code}" already exists.`,
      );
    }

    const definition = WorkflowDefinition.create({
      tenantId,
      code: command.code,
      name: command.name,
      approverRoles: command.approverRoles,
    });

    await repository.save(definition);
    for (const event of definition.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: definition.id.toValue() };
  }
}
