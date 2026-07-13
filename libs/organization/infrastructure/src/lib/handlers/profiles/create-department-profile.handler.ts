import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { CreateDepartmentProfileCommand, CreateDepartmentProfileResult } from '@abms/organization-application';
import { DepartmentProfile } from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from '../current-tenant-id';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../../repositories/typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from '../../repositories/typeorm-org-unit.repository';
import { TypeOrmDepartmentProfileRepository } from '../../repositories/typeorm-department-profile.repository';
import { assertOrgUnitType } from './assert-org-unit-type';

@Injectable()
@CommandHandler(CreateDepartmentProfileCommand)
export class CreateDepartmentProfileHandler extends TransactionalCommandHandler<
  CreateDepartmentProfileCommand,
  CreateDepartmentProfileResult
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork, eventBus);
  }

  protected async handle(
    command: CreateDepartmentProfileCommand,
    ctx: ITransactionContext,
  ): Promise<CreateDepartmentProfileResult> {
    const manager = getEntityManager(ctx);
    const orgUnitRepository = new TypeOrmOrgUnitRepository(manager);
    const typeRepository = new TypeOrmOrgUnitTypeRepository(manager);
    const departmentProfileRepository = new TypeOrmDepartmentProfileRepository(manager);
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
    assertOrgUnitType(orgUnit, orgUnitType, 'DEPARTMENT');

    const existing = await departmentProfileRepository.findByOrgUnitId(orgUnitId);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A department profile already exists for org unit "${command.orgUnitId}".`,
      );
    }

    let costCenterOrgUnitId: EntityId | null = null;
    if (command.costCenterOrgUnitId) {
      costCenterOrgUnitId = EntityId.create(command.costCenterOrgUnitId);
      const costCenterOrgUnit = await orgUnitRepository.findById(costCenterOrgUnitId);
      if (!costCenterOrgUnit) {
        throw new NotFoundDomainException('OrgUnit', command.costCenterOrgUnitId);
      }
      const costCenterType = await typeRepository.findById(costCenterOrgUnit.orgUnitTypeId);
      if (!costCenterType) {
        throw new NotFoundDomainException('OrgUnitType', costCenterOrgUnit.orgUnitTypeId.toValue());
      }
      assertOrgUnitType(costCenterOrgUnit, costCenterType, 'COST_CENTER');
    }

    const profile = DepartmentProfile.create({
      tenantId,
      orgUnitId,
      costCenterOrgUnitId,
      managerReference: command.managerReference,
    });

    await departmentProfileRepository.save(profile);

    return { id: profile.id.toValue() };
  }
}
