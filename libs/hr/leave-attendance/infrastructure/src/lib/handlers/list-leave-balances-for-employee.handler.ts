import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  ListLeaveBalancesForEmployeeQuery,
  LeaveBalanceReadModel,
} from '@abms/hr-leave-attendance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toLeaveBalanceReadModel } from './to-read-model';
import { TypeOrmLeaveBalanceRepository } from '../repositories/typeorm-leave-balance.repository';

@Injectable()
@QueryHandler(ListLeaveBalancesForEmployeeQuery)
export class ListLeaveBalancesForEmployeeHandler extends TransactionalQueryHandler<
  ListLeaveBalancesForEmployeeQuery,
  LeaveBalanceReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListLeaveBalancesForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<LeaveBalanceReadModel[]> {
    const repository = new TypeOrmLeaveBalanceRepository(getEntityManager(ctx));
    const balances = await repository.findAllByEmployee(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
      query.year,
    );
    return balances.map(toLeaveBalanceReadModel);
  }
}
