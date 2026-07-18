import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CompleteOnboardingTaskCommand } from '@abms/hr-recruitment-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOnboardingTaskRepository } from '../repositories/typeorm-onboarding-task.repository';

@Injectable()
@CommandHandler(CompleteOnboardingTaskCommand)
export class CompleteOnboardingTaskHandler extends TransactionalCommandHandler<
  CompleteOnboardingTaskCommand,
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

  protected async handle(command: CompleteOnboardingTaskCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmOnboardingTaskRepository(getEntityManager(ctx));

    const task = await repository.findById(EntityId.create(command.onboardingTaskId));
    if (!task) {
      throw new NotFoundDomainException('OnboardingTask', command.onboardingTaskId);
    }

    task.complete();

    await repository.save(task);
  }
}
