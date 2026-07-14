import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  Address,
  ConcurrencyDomainException,
  CountryCode,
  CurrencyCode,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
} from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { UpdateBranchProfileCommand } from '@abms/organization-application';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmBranchProfileRepository } from '../../repositories/typeorm-branch-profile.repository';

@Injectable()
@CommandHandler(UpdateBranchProfileCommand)
export class UpdateBranchProfileHandler extends TransactionalCommandHandler<UpdateBranchProfileCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContext: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContext, currentUser, auditLogger);
  }

  protected async handle(command: UpdateBranchProfileCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const branchProfileRepository = new TypeOrmBranchProfileRepository(manager);

    const orgUnitId = EntityId.create(command.orgUnitId);
    const profile = await branchProfileRepository.findByOrgUnitId(orgUnitId);
    if (!profile) {
      throw new NotFoundDomainException('BranchProfile', command.orgUnitId);
    }

    if (profile.version !== command.expectedVersion) {
      throw new ConcurrencyDomainException('BranchProfile', command.orgUnitId);
    }

    profile.update({
      address: Address.create({
        line1: command.addressLine1,
        line2: command.addressLine2,
        city: command.addressCity,
        stateOrRegion: command.addressStateOrRegion,
        postalCode: command.addressPostalCode,
        countryCode: CountryCode.create(command.addressCountryCode).getValue(),
      }).getValue(),
      operatingCurrency: CurrencyCode.create(command.operatingCurrency).getValue(),
      contactPhone: command.contactPhone,
      contactEmail: command.contactEmail,
    });

    await branchProfileRepository.save(profile);
  }
}
