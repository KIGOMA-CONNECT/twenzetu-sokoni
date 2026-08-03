import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListOnboardingTasksForEmployeeQuery, OnboardingTaskReadModel } from '@abms/hr-recruitment-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toOnboardingTaskReadModel } from './to-read-model';
import { TypeOrmOnboardingTaskRepository } from '../repositories/typeorm-onboarding-task.repository';

@Injectable()
@QueryHandler(ListOnboardingTasksForEmployeeQuery)
export class ListOnboardingTasksForEmployeeHandler extends TransactionalQueryHandler<
  ListOnboardingTasksForEmployeeQuery,
  OnboardingTaskReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListOnboardingTasksForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<OnboardingTaskReadModel[]> {
    const repository = new TypeOrmOnboardingTaskRepository(getEntityManager(ctx));
    const tasks = await repository.findAllByEmployee(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return tasks.map(toOnboardingTaskReadModel);
  }
}
