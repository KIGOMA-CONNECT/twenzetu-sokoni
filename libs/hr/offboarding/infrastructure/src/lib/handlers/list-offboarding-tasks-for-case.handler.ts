import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListOffboardingTasksForCaseQuery, OffboardingTaskReadModel } from '@abms/hr-offboarding-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toOffboardingTaskReadModel } from './to-read-model';
import { TypeOrmOffboardingTaskRepository } from '../repositories/typeorm-offboarding-task.repository';

@Injectable()
@QueryHandler(ListOffboardingTasksForCaseQuery)
export class ListOffboardingTasksForCaseHandler extends TransactionalQueryHandler<
  ListOffboardingTasksForCaseQuery,
  OffboardingTaskReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListOffboardingTasksForCaseQuery,
    ctx: ITransactionContext,
  ): Promise<OffboardingTaskReadModel[]> {
    const repository = new TypeOrmOffboardingTaskRepository(getEntityManager(ctx));
    const tasks = await repository.findAllByCase(
      currentTenantId(this.tenantContext),
      EntityId.create(query.offboardingCaseId),
    );
    return tasks.map(toOffboardingTaskReadModel);
  }
}
