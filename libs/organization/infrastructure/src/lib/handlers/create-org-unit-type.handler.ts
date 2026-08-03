import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import {
  CreateOrgUnitTypeCommand,
  CreateOrgUnitTypeResult,
} from '@abms/organization-application';
import { OrgUnitType } from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOrgUnitTypeRepository } from '../repositories/typeorm-org-unit-type.repository';

@Injectable()
@CommandHandler(CreateOrgUnitTypeCommand)
export class CreateOrgUnitTypeHandler extends TransactionalCommandHandler<
  CreateOrgUnitTypeCommand,
  CreateOrgUnitTypeResult
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
    command: CreateOrgUnitTypeCommand,
    ctx: ITransactionContext,
  ): Promise<CreateOrgUnitTypeResult> {
    const repository = new TypeOrmOrgUnitTypeRepository(getEntityManager(ctx));

    const type = OrgUnitType.create({
      tenantId: currentTenantId(this.tenantContextStore),
      code: command.code,
      name: command.name,
      description: command.description,
      sortOrder: command.sortOrder,
      allowedParentTypeIds: command.allowedParentTypeIds.map((id) => EntityId.create(id)),
    });

    await repository.save(type);

    return { id: type.id.toValue() };
  }
}
