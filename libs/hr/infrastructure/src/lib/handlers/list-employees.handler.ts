import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { EmployeeReadModel, ListEmployeesQuery } from '@abms/hr-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toEmployeeReadModel } from './to-read-model';
import { TypeOrmEmployeeRepository } from '../repositories/typeorm-employee.repository';

@Injectable()
@QueryHandler(ListEmployeesQuery)
export class ListEmployeesHandler extends TransactionalQueryHandler<ListEmployeesQuery, EmployeeReadModel[]> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListEmployeesQuery,
    ctx: ITransactionContext,
  ): Promise<EmployeeReadModel[]> {
    const repository = new TypeOrmEmployeeRepository(getEntityManager(ctx));
    const employees = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return employees.map(toEmployeeReadModel);
  }
}
