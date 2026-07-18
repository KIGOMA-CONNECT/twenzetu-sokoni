import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListReviewCyclesQuery, ReviewCycleReadModel } from '@abms/hr-performance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toReviewCycleReadModel } from './to-read-model';
import { TypeOrmReviewCycleRepository } from '../repositories/typeorm-review-cycle.repository';

@Injectable()
@QueryHandler(ListReviewCyclesQuery)
export class ListReviewCyclesHandler extends TransactionalQueryHandler<
  ListReviewCyclesQuery,
  ReviewCycleReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListReviewCyclesQuery,
    ctx: ITransactionContext,
  ): Promise<ReviewCycleReadModel[]> {
    const repository = new TypeOrmReviewCycleRepository(getEntityManager(ctx));
    const cycles = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return cycles.map(toReviewCycleReadModel);
  }
}
