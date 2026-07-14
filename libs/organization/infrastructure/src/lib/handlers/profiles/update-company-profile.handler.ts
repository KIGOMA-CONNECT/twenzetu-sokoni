import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  ConcurrencyDomainException,
  CountryCode,
  CurrencyCode,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
  TaxIdentifier,
} from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { UpdateCompanyProfileCommand } from '@abms/organization-application';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmCompanyProfileRepository } from '../../repositories/typeorm-company-profile.repository';

@Injectable()
@CommandHandler(UpdateCompanyProfileCommand)
export class UpdateCompanyProfileHandler extends TransactionalCommandHandler<UpdateCompanyProfileCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContext: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContext, currentUser, auditLogger);
  }

  protected async handle(command: UpdateCompanyProfileCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const companyProfileRepository = new TypeOrmCompanyProfileRepository(manager);

    const orgUnitId = EntityId.create(command.orgUnitId);
    const profile = await companyProfileRepository.findByOrgUnitId(orgUnitId);
    if (!profile) {
      throw new NotFoundDomainException('CompanyProfile', command.orgUnitId);
    }

    if (profile.version !== command.expectedVersion) {
      throw new ConcurrencyDomainException('CompanyProfile', command.orgUnitId);
    }

    profile.update({
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
  }
}
