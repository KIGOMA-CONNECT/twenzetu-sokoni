import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CompleteOffboardingTaskCommand } from '@abms/hr-offboarding-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOffboardingTaskRepository } from '../repositories/typeorm-offboarding-task.repository';

@Injectable()
@CommandHandler(CompleteOffboardingTaskCommand)
export class CompleteOffboardingTaskHandler extends TransactionalCommandHandler<
  CompleteOffboardingTaskCommand,
  void
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CompleteOffboardingTaskCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmOffboardingTaskRepository(getEntityManager(ctx));

    const task = await repository.findById(EntityId.create(command.offboardingTaskId));
    if (!task) {
      throw new NotFoundDomainException('OffboardingTask', command.offboardingTaskId);
    }

    task.complete();

    await repository.save(task);
  }
}
