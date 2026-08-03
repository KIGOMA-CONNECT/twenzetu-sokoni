import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ComplianceRequirementReadModel, ListComplianceRequirementsQuery } from '@abms/hr-compliance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toComplianceRequirementReadModel } from './to-read-model';
import { TypeOrmComplianceRequirementRepository } from '../repositories/typeorm-compliance-requirement.repository';

@Injectable()
@QueryHandler(ListComplianceRequirementsQuery)
export class ListComplianceRequirementsHandler extends TransactionalQueryHandler<
  ListComplianceRequirementsQuery,
  ComplianceRequirementReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListComplianceRequirementsQuery,
    ctx: ITransactionContext,
  ): Promise<ComplianceRequirementReadModel[]> {
    const repository = new TypeOrmComplianceRequirementRepository(getEntityManager(ctx));
    const requirements = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return requirements.map(toComplianceRequirementReadModel);
  }
}
