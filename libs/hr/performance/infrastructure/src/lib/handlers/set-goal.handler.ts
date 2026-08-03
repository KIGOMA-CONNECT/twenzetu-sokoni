import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { SetGoalCommand, SetGoalResult } from '@abms/hr-performance-application';
import { Goal } from '@abms/hr-performance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmGoalRepository } from '../repositories/typeorm-goal.repository';

@Injectable()
@CommandHandler(SetGoalCommand)
export class SetGoalHandler extends TransactionalCommandHandler<SetGoalCommand, SetGoalResult> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: SetGoalCommand, ctx: ITransactionContext): Promise<SetGoalResult> {
    const repository = new TypeOrmGoalRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const goal = Goal.set({
      tenantId,
      employeeId: EntityId.create(command.employeeId),
      title: command.title,
      description: command.description ?? null,
      targetDate: new Date(command.targetDate),
    });

    await repository.save(goal);
    for (const event of goal.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: goal.id.toValue() };
  }
}
