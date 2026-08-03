import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { CreateOrgUnitCommand, CreateOrgUnitResult } from '@abms/organization-application';
import { OrgUnit } from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../repositories/typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from '../repositories/typeorm-org-unit.repository';

@Injectable()
@CommandHandler(CreateOrgUnitCommand)
export class CreateOrgUnitHandler extends TransactionalCommandHandler<
  CreateOrgUnitCommand,
  CreateOrgUnitResult
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
    command: CreateOrgUnitCommand,
    ctx: ITransactionContext,
  ): Promise<CreateOrgUnitResult> {
    const manager = getEntityManager(ctx);
    const typeRepository = new TypeOrmOrgUnitTypeRepository(manager);
    const orgUnitRepository = new TypeOrmOrgUnitRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const orgUnitTypeId = EntityId.create(command.orgUnitTypeId);
    const orgUnitType = await typeRepository.findById(orgUnitTypeId);
    if (!orgUnitType) {
      throw new NotFoundDomainException('OrgUnitType', command.orgUnitTypeId);
    }

    let parentId: EntityId | null = null;
    if (command.parentId) {
      parentId = EntityId.create(command.parentId);
      const parent = await orgUnitRepository.findById(parentId);
      if (!parent) {
        throw new NotFoundDomainException('OrgUnit', command.parentId);
      }
      if (!orgUnitType.allowsParentType(parent.orgUnitTypeId)) {
        throw new BusinessRuleViolationException(
          `Org unit type "${orgUnitType.code}" cannot be created under an org unit of that parent's type.`,
        );
      }
    } else if (!orgUnitType.isRootType()) {
      throw new BusinessRuleViolationException(
        `Org unit type "${orgUnitType.code}" cannot be created as a root org unit.`,
      );
    }

    const orgUnit = OrgUnit.create({
      tenantId,
      orgUnitTypeId,
      parentId,
      code: command.code,
      name: command.name,
      sortOrder: command.sortOrder,
    });

    await orgUnitRepository.save(orgUnit);

    return { id: orgUnit.id.toValue() };
  }
}
