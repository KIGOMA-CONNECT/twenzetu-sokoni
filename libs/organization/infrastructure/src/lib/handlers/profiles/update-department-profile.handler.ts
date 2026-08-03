import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import { ConcurrencyDomainException, EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { UpdateDepartmentProfileCommand } from '@abms/organization-application';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../../repositories/typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from '../../repositories/typeorm-org-unit.repository';
import { TypeOrmDepartmentProfileRepository } from '../../repositories/typeorm-department-profile.repository';
import { assertOrgUnitType } from './assert-org-unit-type';

@Injectable()
@CommandHandler(UpdateDepartmentProfileCommand)
export class UpdateDepartmentProfileHandler extends TransactionalCommandHandler<
  UpdateDepartmentProfileCommand,
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

  protected async handle(command: UpdateDepartmentProfileCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const orgUnitRepository = new TypeOrmOrgUnitRepository(manager);
    const typeRepository = new TypeOrmOrgUnitTypeRepository(manager);
    const departmentProfileRepository = new TypeOrmDepartmentProfileRepository(manager);

    const orgUnitId = EntityId.create(command.orgUnitId);
    const profile = await departmentProfileRepository.findByOrgUnitId(orgUnitId);
    if (!profile) {
      throw new NotFoundDomainException('DepartmentProfile', command.orgUnitId);
    }

    if (profile.version !== command.expectedVersion) {
      throw new ConcurrencyDomainException('DepartmentProfile', command.orgUnitId);
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

    profile.update({ costCenterOrgUnitId, managerReference: command.managerReference });

    await departmentProfileRepository.save(profile);
  }
}
