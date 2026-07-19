import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListSalaryRevisionsForEmployeeQuery, SalaryRevisionReadModel } from '@abms/hr-compensation-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toSalaryRevisionReadModel } from './to-read-model';
import { TypeOrmSalaryRevisionRepository } from '../repositories/typeorm-salary-revision.repository';

@Injectable()
@QueryHandler(ListSalaryRevisionsForEmployeeQuery)
export class ListSalaryRevisionsForEmployeeHandler extends TransactionalQueryHandler<
  ListSalaryRevisionsForEmployeeQuery,
  SalaryRevisionReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListSalaryRevisionsForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<SalaryRevisionReadModel[]> {
    const repository = new TypeOrmSalaryRevisionRepository(getEntityManager(ctx));
    const revisions = await repository.findByEmployeeId(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return revisions.map(toSalaryRevisionReadModel);
  }
}
