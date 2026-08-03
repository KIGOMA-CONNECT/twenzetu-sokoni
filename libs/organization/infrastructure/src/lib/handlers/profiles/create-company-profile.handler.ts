import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  BusinessRuleViolationException,
  CountryCode,
  CurrencyCode,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
  TaxIdentifier,
} from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { CreateCompanyProfileCommand, CreateCompanyProfileResult } from '@abms/organization-application';
import { CompanyProfile } from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from '../current-tenant-id';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../../repositories/typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from '../../repositories/typeorm-org-unit.repository';
import { TypeOrmCompanyProfileRepository } from '../../repositories/typeorm-company-profile.repository';
import { assertOrgUnitType } from './assert-org-unit-type';

@Injectable()
@CommandHandler(CreateCompanyProfileCommand)
export class CreateCompanyProfileHandler extends TransactionalCommandHandler<
  CreateCompanyProfileCommand,
  CreateCompanyProfileResult
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
    command: CreateCompanyProfileCommand,
    ctx: ITransactionContext,
  ): Promise<CreateCompanyProfileResult> {
    const manager = getEntityManager(ctx);
    const orgUnitRepository = new TypeOrmOrgUnitRepository(manager);
    const typeRepository = new TypeOrmOrgUnitTypeRepository(manager);
    const companyProfileRepository = new TypeOrmCompanyProfileRepository(manager);
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
    assertOrgUnitType(orgUnit, orgUnitType, 'COMPANY');

    const existing = await companyProfileRepository.findByOrgUnitId(orgUnitId);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A company profile already exists for org unit "${command.orgUnitId}".`,
      );
    }

    const profile = CompanyProfile.create({
      tenantId,
      orgUnitId,
      legalName: command.legalName,
      registrationNumber: command.registrationNumber,
      taxIdentifier: TaxIdentifier.create(
        CountryCode.create(command.taxCountryCode).getValue(),
        command.taxNumber,
      ).getValue(),
      functionalCurrency: CurrencyCode.create(command.functionalCurrency).getValue(),
      fiscalYearStartMonth: command.fiscalYearStartMonth,
    });

    await companyProfileRepository.save(profile);

    return { id: profile.id.toValue() };
  }
}
