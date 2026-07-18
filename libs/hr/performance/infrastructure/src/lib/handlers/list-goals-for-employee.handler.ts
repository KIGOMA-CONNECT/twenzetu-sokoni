import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { GoalReadModel, ListGoalsForEmployeeQuery } from '@abms/hr-performance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toGoalReadModel } from './to-read-model';
import { TypeOrmGoalRepository } from '../repositories/typeorm-goal.repository';

@Injectable()
@QueryHandler(ListGoalsForEmployeeQuery)
export class ListGoalsForEmployeeHandler extends TransactionalQueryHandler<
  ListGoalsForEmployeeQuery,
  GoalReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListGoalsForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<GoalReadModel[]> {
    const repository = new TypeOrmGoalRepository(getEntityManager(ctx));
    const goals = await repository.findAllByEmployee(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return goals.map(toGoalReadModel);
  }
}
