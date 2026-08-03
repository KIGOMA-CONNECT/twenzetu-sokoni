import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  EmployeeComplianceRecordReadModel,
  ListComplianceRecordsForRequirementQuery,
} from '@abms/hr-compliance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toEmployeeComplianceRecordReadModel } from './to-read-model';
import { TypeOrmEmployeeComplianceRecordRepository } from '../repositories/typeorm-employee-compliance-record.repository';

@Injectable()
@QueryHandler(ListComplianceRecordsForRequirementQuery)
export class ListComplianceRecordsForRequirementHandler extends TransactionalQueryHandler<
  ListComplianceRecordsForRequirementQuery,
  EmployeeComplianceRecordReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListComplianceRecordsForRequirementQuery,
    ctx: ITransactionContext,
  ): Promise<EmployeeComplianceRecordReadModel[]> {
    const repository = new TypeOrmEmployeeComplianceRecordRepository(getEntityManager(ctx));
    const records = await repository.findAllByRequirement(
      currentTenantId(this.tenantContext),
      EntityId.create(query.complianceRequirementId),
    );
    return records.map(toEmployeeComplianceRecordReadModel);
  }
}
