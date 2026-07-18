import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { UpdateGoalProgressCommand } from '@abms/hr-performance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmGoalRepository } from '../repositories/typeorm-goal.repository';

@Injectable()
@CommandHandler(UpdateGoalProgressCommand)
export class UpdateGoalProgressHandler extends TransactionalCommandHandler<UpdateGoalProgressCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: UpdateGoalProgressCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmGoalRepository(getEntityManager(ctx));

    const goal = await repository.findById(EntityId.create(command.goalId));
    if (!goal) {
      throw new NotFoundDomainException('Goal', command.goalId);
    }

    goal.updateProgress(command.progressPercent);

    await repository.save(goal);
  }
}
