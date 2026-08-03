import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, EntityId, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { OpenSuccessionPlanCommand, OpenSuccessionPlanResult } from '@abms/hr-succession-application';
import { SuccessionPlan } from '@abms/hr-succession-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmSuccessionPlanRepository } from '../repositories/typeorm-succession-plan.repository';

@Injectable()
@CommandHandler(OpenSuccessionPlanCommand)
export class OpenSuccessionPlanHandler extends TransactionalCommandHandler<
  OpenSuccessionPlanCommand,
  OpenSuccessionPlanResult
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
    command: OpenSuccessionPlanCommand,
    ctx: ITransactionContext,
  ): Promise<OpenSuccessionPlanResult> {
    const repository = new TypeOrmSuccessionPlanRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);
    const positionId = EntityId.create(command.positionId);

    const existing = await repository.findOpenByPosition(tenantId, positionId);
    if (existing) {
      throw new BusinessRuleViolationException(
        'An open succession plan already exists for this position.',
      );
    }

    const plan = SuccessionPlan.open({
      tenantId,
      positionId,
      notes: command.notes ?? null,
    });

    await repository.save(plan);
    for (const event of plan.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: plan.id.toValue() };
  }
}
