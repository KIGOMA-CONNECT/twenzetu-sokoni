import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { RejectStepCommand } from '@abms/workflow-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmWorkflowInstanceRepository } from '../repositories/typeorm-workflow-instance.repository';

@Injectable()
@CommandHandler(RejectStepCommand)
export class RejectStepHandler extends TransactionalCommandHandler<RejectStepCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContext: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContext, currentUser, auditLogger);
  }

  protected async handle(command: RejectStepCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmWorkflowInstanceRepository(getEntityManager(ctx));

    const instanceId = EntityId.create(command.workflowInstanceId);
    const instance = await repository.findById(instanceId);
    if (!instance) {
      throw new NotFoundDomainException('WorkflowInstance', command.workflowInstanceId);
    }

    instance.rejectStep(command.stepOrder, command.approverUserId, command.approverRole, command.comment);

    await repository.save(instance);
    for (const event of instance.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
