import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  BusinessRuleViolationException,
  ConcurrencyDomainException,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
} from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { MoveOrgUnitCommand } from '@abms/organization-application';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../repositories/typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from '../repositories/typeorm-org-unit.repository';

@Injectable()
@CommandHandler(MoveOrgUnitCommand)
export class MoveOrgUnitHandler extends TransactionalCommandHandler<MoveOrgUnitCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContext: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContext, currentUser, auditLogger);
  }

  protected async handle(command: MoveOrgUnitCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const orgUnitRepository = new TypeOrmOrgUnitRepository(manager);
    const typeRepository = new TypeOrmOrgUnitTypeRepository(manager);

    const orgUnitId = EntityId.create(command.orgUnitId);
    const orgUnit = await orgUnitRepository.findById(orgUnitId);
    if (!orgUnit) {
      throw new NotFoundDomainException('OrgUnit', command.orgUnitId);
    }

    // Distinct from the repository's own optimistic-lock UPDATE check: this guards
    // against the client's read-modify-write cycle across separate requests, not
    // just a race within this single transaction.
    if (orgUnit.version !== command.expectedVersion) {
      throw new ConcurrencyDomainException('OrgUnit', command.orgUnitId);
    }

    const orgUnitType = await typeRepository.findById(orgUnit.orgUnitTypeId);
    if (!orgUnitType) {
      throw new NotFoundDomainException('OrgUnitType', orgUnit.orgUnitTypeId.toValue());
    }

    let newParentId: EntityId | null = null;
    let wouldCreateCycle = false;
    if (command.newParentId) {
      newParentId = EntityId.create(command.newParentId);
      const newParent = await orgUnitRepository.findById(newParentId);
      if (!newParent) {
        throw new NotFoundDomainException('OrgUnit', command.newParentId);
      }
      if (!orgUnitType.allowsParentType(newParent.orgUnitTypeId)) {
        throw new BusinessRuleViolationException(
          `Org unit type "${orgUnitType.code}" cannot be moved under an org unit of that parent's type.`,
        );
      }
      wouldCreateCycle = await orgUnitRepository.wouldCreateCycle(orgUnitId, newParentId);
    } else if (!orgUnitType.isRootType()) {
      throw new BusinessRuleViolationException(
        `Org unit type "${orgUnitType.code}" cannot be moved to become a root org unit.`,
      );
    }

    orgUnit.reparent(newParentId, wouldCreateCycle);
    await orgUnitRepository.save(orgUnit);
  }
}
