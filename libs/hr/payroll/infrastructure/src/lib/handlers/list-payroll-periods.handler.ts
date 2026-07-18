import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListPayrollPeriodsQuery, PayrollPeriodReadModel } from '@abms/hr-payroll-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toPayrollPeriodReadModel } from './to-read-model';
import { TypeOrmPayrollPeriodRepository } from '../repositories/typeorm-payroll-period.repository';

@Injectable()
@QueryHandler(ListPayrollPeriodsQuery)
export class ListPayrollPeriodsHandler extends TransactionalQueryHandler<
  ListPayrollPeriodsQuery,
  PayrollPeriodReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListPayrollPeriodsQuery,
    ctx: ITransactionContext,
  ): Promise<PayrollPeriodReadModel[]> {
    const repository = new TypeOrmPayrollPeriodRepository(getEntityManager(ctx));
    const periods = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return periods.map(toPayrollPeriodReadModel);
  }
}
