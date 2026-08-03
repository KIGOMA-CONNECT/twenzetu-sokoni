import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  EmployeeComplianceRecordReadModel,
  ListComplianceRecordsForEmployeeQuery,
} from '@abms/hr-compliance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toEmployeeComplianceRecordReadModel } from './to-read-model';
import { TypeOrmEmployeeComplianceRecordRepository } from '../repositories/typeorm-employee-compliance-record.repository';

@Injectable()
@QueryHandler(ListComplianceRecordsForEmployeeQuery)
export class ListComplianceRecordsForEmployeeHandler extends TransactionalQueryHandler<
  ListComplianceRecordsForEmployeeQuery,
  EmployeeComplianceRecordReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListComplianceRecordsForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<EmployeeComplianceRecordReadModel[]> {
    const repository = new TypeOrmEmployeeComplianceRecordRepository(getEntityManager(ctx));
    const records = await repository.findAllByEmployee(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return records.map(toEmployeeComplianceRecordReadModel);
  }
}
