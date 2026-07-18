import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { GetPayslipByIdQuery, PayslipReadModel } from '@abms/hr-payroll-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { toPayslipReadModel } from './to-read-model';
import { TypeOrmPayslipRepository } from '../repositories/typeorm-payslip.repository';

@Injectable()
@QueryHandler(GetPayslipByIdQuery)
export class GetPayslipByIdHandler extends TransactionalQueryHandler<
  GetPayslipByIdQuery,
  PayslipReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetPayslipByIdQuery,
    ctx: ITransactionContext,
  ): Promise<PayslipReadModel | null> {
    const repository = new TypeOrmPayslipRepository(getEntityManager(ctx));
    const payslip = await repository.findById(EntityId.create(query.payslipId));
    return payslip ? toPayslipReadModel(payslip) : null;
  }
}
