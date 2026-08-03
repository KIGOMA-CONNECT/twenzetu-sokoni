import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { JobRequisitionReadModel, ListJobRequisitionsQuery } from '@abms/hr-recruitment-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toJobRequisitionReadModel } from './to-read-model';
import { TypeOrmJobRequisitionRepository } from '../repositories/typeorm-job-requisition.repository';

@Injectable()
@QueryHandler(ListJobRequisitionsQuery)
export class ListJobRequisitionsHandler extends TransactionalQueryHandler<
  ListJobRequisitionsQuery,
  JobRequisitionReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListJobRequisitionsQuery,
    ctx: ITransactionContext,
  ): Promise<JobRequisitionReadModel[]> {
    const repository = new TypeOrmJobRequisitionRepository(getEntityManager(ctx));
    const requisitions = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return requisitions.map(toJobRequisitionReadModel);
  }
}
