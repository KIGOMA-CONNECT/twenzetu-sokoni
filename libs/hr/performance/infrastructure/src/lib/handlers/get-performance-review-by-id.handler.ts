import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { GetPerformanceReviewByIdQuery, PerformanceReviewReadModel } from '@abms/hr-performance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { toPerformanceReviewReadModel } from './to-read-model';
import { TypeOrmPerformanceReviewRepository } from '../repositories/typeorm-performance-review.repository';

@Injectable()
@QueryHandler(GetPerformanceReviewByIdQuery)
export class GetPerformanceReviewByIdHandler extends TransactionalQueryHandler<
  GetPerformanceReviewByIdQuery,
  PerformanceReviewReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetPerformanceReviewByIdQuery,
    ctx: ITransactionContext,
  ): Promise<PerformanceReviewReadModel | null> {
    const repository = new TypeOrmPerformanceReviewRepository(getEntityManager(ctx));
    const review = await repository.findById(EntityId.create(query.performanceReviewId));
    return review ? toPerformanceReviewReadModel(review) : null;
  }
}
