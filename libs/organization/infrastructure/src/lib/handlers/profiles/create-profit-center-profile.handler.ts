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
import { CreateProfitCenterProfileCommand, CreateProfitCenterProfileResult } from '@abms/organization-application';
import { ProfitCenterProfile } from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from '../current-tenant-id';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../../repositories/typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from '../../repositories/typeorm-org-unit.repository';
import { TypeOrmProfitCenterProfileRepository } from '../../repositories/typeorm-profit-center-profile.repository';
import { assertOrgUnitType } from './assert-org-unit-type';

@Injectable()
@CommandHandler(CreateProfitCenterProfileCommand)
export class CreateProfitCenterProfileHandler extends TransactionalCommandHandler<
  CreateProfitCenterProfileCommand,
  CreateProfitCenterProfileResult
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork, eventBus);
  }

  protected async handle(
    command: CreateProfitCenterProfileCommand,
    ctx: ITransactionContext,
  ): Promise<CreateProfitCenterProfileResult> {
    const manager = getEntityManager(ctx);
    const orgUnitRepository = new TypeOrmOrgUnitRepository(manager);
    const typeRepository = new TypeOrmOrgUnitTypeRepository(manager);
    const profitCenterProfileRepository = new TypeOrmProfitCenterProfileRepository(manager);
    const tenantId = currentTenantId(this.tenantContext);

    const orgUnitId = EntityId.create(command.orgUnitId);
    const orgUnit = await orgUnitRepository.findById(orgUnitId);
    if (!orgUnit) {
      throw new NotFoundDomainException('OrgUnit', command.orgUnitId);
    }

    const orgUnitType = await typeRepository.findById(orgUnit.orgUnitTypeId);
    if (!orgUnitType) {
      throw new NotFoundDomainException('OrgUnitType', orgUnit.orgUnitTypeId.toValue());
    }
    assertOrgUnitType(orgUnit, orgUnitType, 'PROFIT_CENTER');

    const existing = await profitCenterProfileRepository.findByOrgUnitId(orgUnitId);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A profit center profile already exists for org unit "${command.orgUnitId}".`,
      );
    }

    const profile = ProfitCenterProfile.create({
      tenantId,
      orgUnitId,
      revenueTarget: Money.create(
        command.revenueTargetAmount,
        CurrencyCode.create(command.revenueTargetCurrency).getValue(),
      ).getValue(),
      reportingCurrency: CurrencyCode.create(command.reportingCurrency).getValue(),
      glAccountCode: command.glAccountCode,
    });

    await profitCenterProfileRepository.save(profile);

    return { id: profile.id.toValue() };
  }
}
