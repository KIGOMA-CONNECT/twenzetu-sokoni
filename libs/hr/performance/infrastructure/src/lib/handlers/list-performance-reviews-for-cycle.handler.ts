import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  ListPerformanceReviewsForCycleQuery,
  PerformanceReviewReadModel,
} from '@abms/hr-performance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toPerformanceReviewReadModel } from './to-read-model';
import { TypeOrmPerformanceReviewRepository } from '../repositories/typeorm-performance-review.repository';

@Injectable()
@QueryHandler(ListPerformanceReviewsForCycleQuery)
export class ListPerformanceReviewsForCycleHandler extends TransactionalQueryHandler<
  ListPerformanceReviewsForCycleQuery,
  PerformanceReviewReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListPerformanceReviewsForCycleQuery,
    ctx: ITransactionContext,
  ): Promise<PerformanceReviewReadModel[]> {
    const repository = new TypeOrmPerformanceReviewRepository(getEntityManager(ctx));
    const reviews = await repository.findAllByCycle(
      currentTenantId(this.tenantContext),
      EntityId.create(query.reviewCycleId),
    );
    return reviews.map(toPerformanceReviewReadModel);
  }
}
