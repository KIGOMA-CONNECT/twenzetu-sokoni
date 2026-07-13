import { TenantAwareUnitOfWork } from '@abms/database';
import {
  Address,
  BusinessRuleViolationException,
  CountryCode,
  CurrencyCode,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
} from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { CreateBranchProfileCommand, CreateBranchProfileResult } from '@abms/organization-application';
import { BranchProfile } from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from '../current-tenant-id';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../../repositories/typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from '../../repositories/typeorm-org-unit.repository';
import { TypeOrmBranchProfileRepository } from '../../repositories/typeorm-branch-profile.repository';
import { assertOrgUnitType } from './assert-org-unit-type';

@Injectable()
@CommandHandler(CreateBranchProfileCommand)
export class CreateBranchProfileHandler extends TransactionalCommandHandler<
  CreateBranchProfileCommand,
  CreateBranchProfileResult
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork, eventBus);
  }

  protected async handle(
    command: CreateBranchProfileCommand,
    ctx: ITransactionContext,
  ): Promise<CreateBranchProfileResult> {
    const manager = getEntityManager(ctx);
    const orgUnitRepository = new TypeOrmOrgUnitRepository(manager);
    const typeRepository = new TypeOrmOrgUnitTypeRepository(manager);
    const branchProfileRepository = new TypeOrmBranchProfileRepository(manager);
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
    assertOrgUnitType(orgUnit, orgUnitType, 'BRANCH');

    const existing = await branchProfileRepository.findByOrgUnitId(orgUnitId);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A branch profile already exists for org unit "${command.orgUnitId}".`,
      );
    }

    const profile = BranchProfile.create({
      tenantId,
      orgUnitId,
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

    return { id: profile.id.toValue() };
  }
}
