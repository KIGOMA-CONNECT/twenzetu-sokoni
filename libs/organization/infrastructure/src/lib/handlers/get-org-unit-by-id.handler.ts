import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { GetOrgUnitByIdQuery, OrgUnitReadModel } from '@abms/organization-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { toOrgUnitReadModel } from './to-read-model';
import { TypeOrmOrgUnitRepository } from '../repositories/typeorm-org-unit.repository';

@Injectable()
@QueryHandler(GetOrgUnitByIdQuery)
export class GetOrgUnitByIdHandler extends TransactionalQueryHandler<
  GetOrgUnitByIdQuery,
  OrgUnitReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetOrgUnitByIdQuery,
    ctx: ITransactionContext,
  ): Promise<OrgUnitReadModel | null> {
    const repository = new TypeOrmOrgUnitRepository(getEntityManager(ctx));
    const orgUnit = await repository.findById(EntityId.create(query.orgUnitId));
    return orgUnit ? toOrgUnitReadModel(orgUnit) : null;
  }
}
