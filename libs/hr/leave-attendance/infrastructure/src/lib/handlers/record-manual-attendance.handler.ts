import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, EntityId, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  RecordManualAttendanceCommand,
  RecordManualAttendanceResult,
} from '@abms/hr-leave-attendance-application';
import { AttendanceRecord } from '@abms/hr-leave-attendance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmAttendanceRecordRepository } from '../repositories/typeorm-attendance-record.repository';

@Injectable()
@CommandHandler(RecordManualAttendanceCommand)
export class RecordManualAttendanceHandler extends TransactionalCommandHandler<
  RecordManualAttendanceCommand,
  RecordManualAttendanceResult
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(
    command: RecordManualAttendanceCommand,
    ctx: ITransactionContext,
  ): Promise<RecordManualAttendanceResult> {
    const repository = new TypeOrmAttendanceRecordRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);
    const employeeId = EntityId.create(command.employeeId);
    const date = new Date(command.date);

    const existing = await repository.findByEmployeeAndDate(tenantId, employeeId, date);
    if (existing) {
      throw new BusinessRuleViolationException(
        `An attendance record already exists for this employee on ${command.date}.`,
      );
    }

    const record = AttendanceRecord.recordManual({
      tenantId,
      employeeId,
      date,
      status: command.status,
    });

    await repository.save(record);

    return { id: record.id.toValue() };
  }
}
