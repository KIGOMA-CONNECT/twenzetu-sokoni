import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CreateBenefitPlanCommand, CreateBenefitPlanResult } from '@abms/hr-compensation-application';
import { BenefitPlan } from '@abms/hr-compensation-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmBenefitPlanRepository } from '../repositories/typeorm-benefit-plan.repository';

@Injectable()
@CommandHandler(CreateBenefitPlanCommand)
export class CreateBenefitPlanHandler extends TransactionalCommandHandler<
  CreateBenefitPlanCommand,
  CreateBenefitPlanResult
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
    command: CreateBenefitPlanCommand,
    ctx: ITransactionContext,
  ): Promise<CreateBenefitPlanResult> {
    const repository = new TypeOrmBenefitPlanRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const plan = BenefitPlan.create({
      tenantId,
      name: command.name,
      benefitType: command.benefitType,
      employerContributionRateBasisPoints: command.employerContributionRateBasisPoints,
    });

    await repository.save(plan);
    for (const event of plan.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: plan.id.toValue() };
  }
}
