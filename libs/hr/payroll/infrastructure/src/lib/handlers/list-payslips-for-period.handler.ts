import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListPayslipsForPeriodQuery, PayslipReadModel } from '@abms/hr-payroll-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toPayslipReadModel } from './to-read-model';
import { TypeOrmPayslipRepository } from '../repositories/typeorm-payslip.repository';

@Injectable()
@QueryHandler(ListPayslipsForPeriodQuery)
export class ListPayslipsForPeriodHandler extends TransactionalQueryHandler<
  ListPayslipsForPeriodQuery,
  PayslipReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListPayslipsForPeriodQuery,
    ctx: ITransactionContext,
  ): Promise<PayslipReadModel[]> {
    const repository = new TypeOrmPayslipRepository(getEntityManager(ctx));
    const payslips = await repository.findAllByPeriod(
      currentTenantId(this.tenantContext),
      EntityId.create(query.payrollPeriodId),
    );
    return payslips.map(toPayslipReadModel);
  }
}
