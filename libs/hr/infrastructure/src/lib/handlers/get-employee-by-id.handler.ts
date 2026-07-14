import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { EmployeeReadModel, GetEmployeeByIdQuery } from '@abms/hr-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { toEmployeeReadModel } from './to-read-model';
import { TypeOrmEmployeeRepository } from '../repositories/typeorm-employee.repository';

@Injectable()
@QueryHandler(GetEmployeeByIdQuery)
export class GetEmployeeByIdHandler extends TransactionalQueryHandler<
  GetEmployeeByIdQuery,
  EmployeeReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetEmployeeByIdQuery,
    ctx: ITransactionContext,
  ): Promise<EmployeeReadModel | null> {
    const repository = new TypeOrmEmployeeRepository(getEntityManager(ctx));
    const employee = await repository.findById(EntityId.create(query.employeeId));
    return employee ? toEmployeeReadModel(employee) : null;
  }
}
