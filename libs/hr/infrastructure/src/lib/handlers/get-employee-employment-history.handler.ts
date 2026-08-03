import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { EmploymentHistoryEntryReadModel, GetEmployeeEmploymentHistoryQuery } from '@abms/hr-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toEmploymentHistoryEntryReadModel } from './to-read-model';
import { TypeOrmEmploymentHistoryRepository } from '../repositories/typeorm-employment-history.repository';

@Injectable()
@QueryHandler(GetEmployeeEmploymentHistoryQuery)
export class GetEmployeeEmploymentHistoryHandler extends TransactionalQueryHandler<
  GetEmployeeEmploymentHistoryQuery,
  EmploymentHistoryEntryReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetEmployeeEmploymentHistoryQuery,
    ctx: ITransactionContext,
  ): Promise<EmploymentHistoryEntryReadModel[]> {
    const repository = new TypeOrmEmploymentHistoryRepository(getEntityManager(ctx));
    const entries = await repository.findByEmployeeId(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return entries.map(toEmploymentHistoryEntryReadModel);
  }
}
