import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { CostCenterProfileReadModel, GetCostCenterProfileByOrgUnitIdQuery } from '@abms/organization-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmCostCenterProfileRepository } from '../../repositories/typeorm-cost-center-profile.repository';
import { toCostCenterProfileReadModel } from './to-profile-read-model';

@Injectable()
@QueryHandler(GetCostCenterProfileByOrgUnitIdQuery)
export class GetCostCenterProfileByOrgUnitIdHandler extends TransactionalQueryHandler<
  GetCostCenterProfileByOrgUnitIdQuery,
  CostCenterProfileReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetCostCenterProfileByOrgUnitIdQuery,
    ctx: ITransactionContext,
  ): Promise<CostCenterProfileReadModel | null> {
    const repository = new TypeOrmCostCenterProfileRepository(getEntityManager(ctx));
    const profile = await repository.findByOrgUnitId(EntityId.create(query.orgUnitId));
    return profile ? toCostCenterProfileReadModel(profile) : null;
  }
}
