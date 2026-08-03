import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { DeactivateBenefitPlanCommand } from '@abms/hr-compensation-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmBenefitPlanRepository } from '../repositories/typeorm-benefit-plan.repository';

@Injectable()
@CommandHandler(DeactivateBenefitPlanCommand)
export class DeactivateBenefitPlanHandler extends TransactionalCommandHandler<
  DeactivateBenefitPlanCommand,
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

  protected async handle(command: DeactivateBenefitPlanCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmBenefitPlanRepository(getEntityManager(ctx));

    const plan = await repository.findById(EntityId.create(command.benefitPlanId));
    if (!plan) {
      throw new NotFoundDomainException('BenefitPlan', command.benefitPlanId);
    }

    plan.deactivate();

    await repository.save(plan);
    for (const event of plan.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
