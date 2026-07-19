import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { BenefitPlanReadModel, ListBenefitPlansQuery } from '@abms/hr-compensation-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toBenefitPlanReadModel } from './to-read-model';
import { TypeOrmBenefitPlanRepository } from '../repositories/typeorm-benefit-plan.repository';

@Injectable()
@QueryHandler(ListBenefitPlansQuery)
export class ListBenefitPlansHandler extends TransactionalQueryHandler<
  ListBenefitPlansQuery,
  BenefitPlanReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListBenefitPlansQuery,
    ctx: ITransactionContext,
  ): Promise<BenefitPlanReadModel[]> {
    const repository = new TypeOrmBenefitPlanRepository(getEntityManager(ctx));
    const plans = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return plans.map(toBenefitPlanReadModel);
  }
}
