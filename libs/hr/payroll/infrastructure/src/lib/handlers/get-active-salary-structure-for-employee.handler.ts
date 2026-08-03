import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  GetActiveSalaryStructureForEmployeeQuery,
  SalaryStructureReadModel,
} from '@abms/hr-payroll-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toSalaryStructureReadModel } from './to-read-model';
import { TypeOrmSalaryStructureRepository } from '../repositories/typeorm-salary-structure.repository';

@Injectable()
@QueryHandler(GetActiveSalaryStructureForEmployeeQuery)
export class GetActiveSalaryStructureForEmployeeHandler extends TransactionalQueryHandler<
  GetActiveSalaryStructureForEmployeeQuery,
  SalaryStructureReadModel | null
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetActiveSalaryStructureForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<SalaryStructureReadModel | null> {
    const repository = new TypeOrmSalaryStructureRepository(getEntityManager(ctx));
    const structure = await repository.findActiveByEmployee(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return structure ? toSalaryStructureReadModel(structure) : null;
  }
}
