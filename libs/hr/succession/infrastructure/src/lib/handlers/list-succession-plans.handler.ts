import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListSuccessionPlansQuery, SuccessionPlanReadModel } from '@abms/hr-succession-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toSuccessionPlanReadModel } from './to-read-model';
import { TypeOrmSuccessionPlanRepository } from '../repositories/typeorm-succession-plan.repository';

@Injectable()
@QueryHandler(ListSuccessionPlansQuery)
export class ListSuccessionPlansHandler extends TransactionalQueryHandler<
  ListSuccessionPlansQuery,
  SuccessionPlanReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListSuccessionPlansQuery,
    ctx: ITransactionContext,
  ): Promise<SuccessionPlanReadModel[]> {
    const repository = new TypeOrmSuccessionPlanRepository(getEntityManager(ctx));
    const plans = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return plans.map(toSuccessionPlanReadModel);
  }
}
