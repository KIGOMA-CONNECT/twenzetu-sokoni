import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListCandidatesForPlanQuery, SuccessionCandidateReadModel } from '@abms/hr-succession-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toSuccessionCandidateReadModel } from './to-read-model';
import { TypeOrmSuccessionCandidateRepository } from '../repositories/typeorm-succession-candidate.repository';

@Injectable()
@QueryHandler(ListCandidatesForPlanQuery)
export class ListCandidatesForPlanHandler extends TransactionalQueryHandler<
  ListCandidatesForPlanQuery,
  SuccessionCandidateReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListCandidatesForPlanQuery,
    ctx: ITransactionContext,
  ): Promise<SuccessionCandidateReadModel[]> {
    const repository = new TypeOrmSuccessionCandidateRepository(getEntityManager(ctx));
    const candidates = await repository.findAllByPlan(
      currentTenantId(this.tenantContext),
      EntityId.create(query.successionPlanId),
    );
    return candidates.map(toSuccessionCandidateReadModel);
  }
}
