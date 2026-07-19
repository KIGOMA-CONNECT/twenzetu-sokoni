import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListOffboardingCasesQuery, OffboardingCaseReadModel } from '@abms/hr-offboarding-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toOffboardingCaseReadModel } from './to-read-model';
import { TypeOrmOffboardingCaseRepository } from '../repositories/typeorm-offboarding-case.repository';

@Injectable()
@QueryHandler(ListOffboardingCasesQuery)
export class ListOffboardingCasesHandler extends TransactionalQueryHandler<
  ListOffboardingCasesQuery,
  OffboardingCaseReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListOffboardingCasesQuery,
    ctx: ITransactionContext,
  ): Promise<OffboardingCaseReadModel[]> {
    const repository = new TypeOrmOffboardingCaseRepository(getEntityManager(ctx));
    const cases = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return cases.map(toOffboardingCaseReadModel);
  }
}
