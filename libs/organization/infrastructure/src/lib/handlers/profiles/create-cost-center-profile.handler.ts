import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  BusinessRuleViolationException,
  CurrencyCode,
  EntityId,
  ITransactionContext,
  Money,
  NotFoundDomainException,
} from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { CreateCostCenterProfileCommand, CreateCostCenterProfileResult } from '@abms/organization-application';
import { CostCenterProfile } from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from '../current-tenant-id';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../../repositories/typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from '../../repositories/typeorm-org-unit.repository';
import { TypeOrmCostCenterProfileRepository } from '../../repositories/typeorm-cost-center-profile.repository';
import { assertOrgUnitType } from './assert-org-unit-type';

@Injectable()
@CommandHandler(CreateCostCenterProfileCommand)
export class CreateCostCenterProfileHandler extends TransactionalCommandHandler<
  CreateCostCenterProfileCommand,
  CreateCostCenterProfileResult
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
    command: CreateCostCenterProfileCommand,
    ctx: ITransactionContext,
  ): Promise<CreateCostCenterProfileResult> {
    const manager = getEntityManager(ctx);
    const orgUnitRepository = new TypeOrmOrgUnitRepository(manager);
    const typeRepository = new TypeOrmOrgUnitTypeRepository(manager);
    const costCenterProfileRepository = new TypeOrmCostCenterProfileRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const orgUnitId = EntityId.create(command.orgUnitId);
    const orgUnit = await orgUnitRepository.findById(orgUnitId);
    if (!orgUnit) {
      throw new NotFoundDomainException('OrgUnit', command.orgUnitId);
    }

    const orgUnitType = await typeRepository.findById(orgUnit.orgUnitTypeId);
    if (!orgUnitType) {
      throw new NotFoundDomainException('OrgUnitType', orgUnit.orgUnitTypeId.toValue());
    }
    assertOrgUnitType(orgUnit, orgUnitType, 'COST_CENTER');

    const existing = await costCenterProfileRepository.findByOrgUnitId(orgUnitId);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A cost center profile already exists for org unit "${command.orgUnitId}".`,
      );
    }

    const profile = CostCenterProfile.create({
      tenantId,
      orgUnitId,
      budget: Money.create(command.budgetAmount, CurrencyCode.create(command.budgetCurrency).getValue()).getValue(),
      budgetPeriodStart: new Date(command.budgetPeriodStart),
      budgetPeriodEnd: new Date(command.budgetPeriodEnd),
      glAccountCode: command.glAccountCode,
    });

    await costCenterProfileRepository.save(profile);

    return { id: profile.id.toValue() };
  }
}
