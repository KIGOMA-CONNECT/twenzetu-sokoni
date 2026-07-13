import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { DepartmentProfileReadModel, GetDepartmentProfileByOrgUnitIdQuery } from '@abms/organization-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmDepartmentProfileRepository } from '../../repositories/typeorm-department-profile.repository';
import { toDepartmentProfileReadModel } from './to-profile-read-model';

@Injectable()
@QueryHandler(GetDepartmentProfileByOrgUnitIdQuery)
export class GetDepartmentProfileByOrgUnitIdHandler extends TransactionalQueryHandler<
  GetDepartmentProfileByOrgUnitIdQuery,
  DepartmentProfileReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetDepartmentProfileByOrgUnitIdQuery,
    ctx: ITransactionContext,
  ): Promise<DepartmentProfileReadModel | null> {
    const repository = new TypeOrmDepartmentProfileRepository(getEntityManager(ctx));
    const profile = await repository.findByOrgUnitId(EntityId.create(query.orgUnitId));
    return profile ? toDepartmentProfileReadModel(profile) : null;
  }
}
