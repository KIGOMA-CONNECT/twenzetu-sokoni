import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { CompanyProfileReadModel, GetCompanyProfileByOrgUnitIdQuery } from '@abms/organization-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmCompanyProfileRepository } from '../../repositories/typeorm-company-profile.repository';
import { toCompanyProfileReadModel } from './to-profile-read-model';

@Injectable()
@QueryHandler(GetCompanyProfileByOrgUnitIdQuery)
export class GetCompanyProfileByOrgUnitIdHandler extends TransactionalQueryHandler<
  GetCompanyProfileByOrgUnitIdQuery,
  CompanyProfileReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetCompanyProfileByOrgUnitIdQuery,
    ctx: ITransactionContext,
  ): Promise<CompanyProfileReadModel | null> {
    const repository = new TypeOrmCompanyProfileRepository(getEntityManager(ctx));
    const profile = await repository.findByOrgUnitId(EntityId.create(query.orgUnitId));
    return profile ? toCompanyProfileReadModel(profile) : null;
  }
}
