import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { BranchProfileReadModel, GetBranchProfileByOrgUnitIdQuery } from '@abms/organization-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmBranchProfileRepository } from '../../repositories/typeorm-branch-profile.repository';
import { toBranchProfileReadModel } from './to-profile-read-model';

@Injectable()
@QueryHandler(GetBranchProfileByOrgUnitIdQuery)
export class GetBranchProfileByOrgUnitIdHandler extends TransactionalQueryHandler<
  GetBranchProfileByOrgUnitIdQuery,
  BranchProfileReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetBranchProfileByOrgUnitIdQuery,
    ctx: ITransactionContext,
  ): Promise<BranchProfileReadModel | null> {
    const repository = new TypeOrmBranchProfileRepository(getEntityManager(ctx));
    const profile = await repository.findByOrgUnitId(EntityId.create(query.orgUnitId));
    return profile ? toBranchProfileReadModel(profile) : null;
  }
}
