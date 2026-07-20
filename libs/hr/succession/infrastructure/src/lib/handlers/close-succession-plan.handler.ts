import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CloseSuccessionPlanCommand } from '@abms/hr-succession-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmSuccessionPlanRepository } from '../repositories/typeorm-succession-plan.repository';

@Injectable()
@CommandHandler(CloseSuccessionPlanCommand)
export class CloseSuccessionPlanHandler extends TransactionalCommandHandler<CloseSuccessionPlanCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CloseSuccessionPlanCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmSuccessionPlanRepository(getEntityManager(ctx));

    const plan = await repository.findById(EntityId.create(command.successionPlanId));
    if (!plan) {
      throw new NotFoundDomainException('SuccessionPlan', command.successionPlanId);
    }

    plan.close();

    await repository.save(plan);
    for (const event of plan.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
