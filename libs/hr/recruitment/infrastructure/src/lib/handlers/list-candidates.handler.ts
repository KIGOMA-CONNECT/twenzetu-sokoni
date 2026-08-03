import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CandidateReadModel, ListCandidatesQuery } from '@abms/hr-recruitment-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toCandidateReadModel } from './to-read-model';
import { TypeOrmCandidateRepository } from '../repositories/typeorm-candidate.repository';

@Injectable()
@QueryHandler(ListCandidatesQuery)
export class ListCandidatesHandler extends TransactionalQueryHandler<ListCandidatesQuery, CandidateReadModel[]> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListCandidatesQuery,
    ctx: ITransactionContext,
  ): Promise<CandidateReadModel[]> {
    const repository = new TypeOrmCandidateRepository(getEntityManager(ctx));
    const candidates = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return candidates.map(toCandidateReadModel);
  }
}
