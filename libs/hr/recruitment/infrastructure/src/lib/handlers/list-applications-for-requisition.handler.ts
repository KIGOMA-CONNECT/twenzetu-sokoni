import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ApplicationReadModel, ListApplicationsForRequisitionQuery } from '@abms/hr-recruitment-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toApplicationReadModel } from './to-read-model';
import { TypeOrmApplicationRepository } from '../repositories/typeorm-application.repository';

@Injectable()
@QueryHandler(ListApplicationsForRequisitionQuery)
export class ListApplicationsForRequisitionHandler extends TransactionalQueryHandler<
  ListApplicationsForRequisitionQuery,
  ApplicationReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListApplicationsForRequisitionQuery,
    ctx: ITransactionContext,
  ): Promise<ApplicationReadModel[]> {
    const repository = new TypeOrmApplicationRepository(getEntityManager(ctx));
    const applications = await repository.findAllByJobRequisition(
      currentTenantId(this.tenantContext),
      EntityId.create(query.jobRequisitionId),
    );
    return applications.map(toApplicationReadModel);
  }
}
