import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  GetAttendanceForEmployeeQuery,
  AttendanceRecordReadModel,
} from '@abms/hr-leave-attendance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toAttendanceRecordReadModel } from './to-read-model';
import { TypeOrmAttendanceRecordRepository } from '../repositories/typeorm-attendance-record.repository';

@Injectable()
@QueryHandler(GetAttendanceForEmployeeQuery)
export class GetAttendanceForEmployeeHandler extends TransactionalQueryHandler<
  GetAttendanceForEmployeeQuery,
  AttendanceRecordReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetAttendanceForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<AttendanceRecordReadModel[]> {
    const repository = new TypeOrmAttendanceRecordRepository(getEntityManager(ctx));
    const records = await repository.findByEmployeeAndDateRange(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
      new Date(query.startDate),
      new Date(query.endDate),
    );
    return records.map(toAttendanceRecordReadModel);
  }
}
