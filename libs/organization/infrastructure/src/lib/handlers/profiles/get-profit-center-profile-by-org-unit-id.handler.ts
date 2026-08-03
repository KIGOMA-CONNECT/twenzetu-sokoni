import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { GetProfitCenterProfileByOrgUnitIdQuery, ProfitCenterProfileReadModel } from '@abms/organization-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmProfitCenterProfileRepository } from '../../repositories/typeorm-profit-center-profile.repository';
import { toProfitCenterProfileReadModel } from './to-profile-read-model';

@Injectable()
@QueryHandler(GetProfitCenterProfileByOrgUnitIdQuery)
export class GetProfitCenterProfileByOrgUnitIdHandler extends TransactionalQueryHandler<
  GetProfitCenterProfileByOrgUnitIdQuery,
  ProfitCenterProfileReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetProfitCenterProfileByOrgUnitIdQuery,
    ctx: ITransactionContext,
  ): Promise<ProfitCenterProfileReadModel | null> {
    const repository = new TypeOrmProfitCenterProfileRepository(getEntityManager(ctx));
    const profile = await repository.findByOrgUnitId(EntityId.create(query.orgUnitId));
    return profile ? toProfitCenterProfileReadModel(profile) : null;
  }
}
