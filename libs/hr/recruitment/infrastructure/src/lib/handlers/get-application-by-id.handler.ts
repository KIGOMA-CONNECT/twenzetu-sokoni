import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { ApplicationReadModel, GetApplicationByIdQuery } from '@abms/hr-recruitment-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { toApplicationReadModel } from './to-read-model';
import { TypeOrmApplicationRepository } from '../repositories/typeorm-application.repository';

@Injectable()
@QueryHandler(GetApplicationByIdQuery)
export class GetApplicationByIdHandler extends TransactionalQueryHandler<
  GetApplicationByIdQuery,
  ApplicationReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetApplicationByIdQuery,
    ctx: ITransactionContext,
  ): Promise<ApplicationReadModel | null> {
    const repository = new TypeOrmApplicationRepository(getEntityManager(ctx));
    const application = await repository.findById(EntityId.create(query.applicationId));
    return application ? toApplicationReadModel(application) : null;
  }
}
