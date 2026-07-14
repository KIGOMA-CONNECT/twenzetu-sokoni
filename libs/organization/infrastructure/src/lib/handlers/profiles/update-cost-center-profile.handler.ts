import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  ConcurrencyDomainException,
  CurrencyCode,
  EntityId,
  ITransactionContext,
  Money,
  NotFoundDomainException,
} from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { UpdateCostCenterProfileCommand } from '@abms/organization-application';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmCostCenterProfileRepository } from '../../repositories/typeorm-cost-center-profile.repository';

@Injectable()
@CommandHandler(UpdateCostCenterProfileCommand)
export class UpdateCostCenterProfileHandler extends TransactionalCommandHandler<
  UpdateCostCenterProfileCommand,
  void
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContext: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContext, currentUser, auditLogger);
  }

  protected async handle(command: UpdateCostCenterProfileCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const costCenterProfileRepository = new TypeOrmCostCenterProfileRepository(manager);

    const orgUnitId = EntityId.create(command.orgUnitId);
    const profile = await costCenterProfileRepository.findByOrgUnitId(orgUnitId);
    if (!profile) {
      throw new NotFoundDomainException('CostCenterProfile', command.orgUnitId);
    }

    if (profile.version !== command.expectedVersion) {
      throw new ConcurrencyDomainException('CostCenterProfile', command.orgUnitId);
    }

    profile.update({
      budget: Money.create(command.budgetAmount, CurrencyCode.create(command.budgetCurrency).getValue()).getValue(),
      budgetPeriodStart: new Date(command.budgetPeriodStart),
      budgetPeriodEnd: new Date(command.budgetPeriodEnd),
      glAccountCode: command.glAccountCode,
    });

    await costCenterProfileRepository.save(profile);
  }
}
