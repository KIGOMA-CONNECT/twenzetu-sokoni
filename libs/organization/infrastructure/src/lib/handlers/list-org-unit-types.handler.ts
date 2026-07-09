import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { ListOrgUnitTypesQuery, OrgUnitTypeReadModel } from '@abms/organization-application';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toOrgUnitTypeReadModel } from './to-read-model';
import { TypeOrmOrgUnitTypeRepository } from '../repositories/typeorm-org-unit-type.repository';

@Injectable()
@QueryHandler(ListOrgUnitTypesQuery)
export class ListOrgUnitTypesHandler extends TransactionalQueryHandler<
  ListOrgUnitTypesQuery,
  OrgUnitTypeReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListOrgUnitTypesQuery,
    ctx: ITransactionContext,
  ): Promise<OrgUnitTypeReadModel[]> {
    const repository = new TypeOrmOrgUnitTypeRepository(getEntityManager(ctx));
    const types = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return types.map(toOrgUnitTypeReadModel);
  }
}
