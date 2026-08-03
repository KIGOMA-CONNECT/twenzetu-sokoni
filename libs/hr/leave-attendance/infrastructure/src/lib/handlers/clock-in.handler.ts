import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, EntityId, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ClockInCommand, ClockInResult } from '@abms/hr-leave-attendance-application';
import { AttendanceRecord } from '@abms/hr-leave-attendance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmAttendanceRecordRepository } from '../repositories/typeorm-attendance-record.repository';

@Injectable()
@CommandHandler(ClockInCommand)
export class ClockInHandler extends TransactionalCommandHandler<ClockInCommand, ClockInResult> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: ClockInCommand, ctx: ITransactionContext): Promise<ClockInResult> {
    const repository = new TypeOrmAttendanceRecordRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);
    const employeeId = EntityId.create(command.employeeId);
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const existing = await repository.findByEmployeeAndDate(tenantId, employeeId, today);
    if (existing) {
      throw new BusinessRuleViolationException('An attendance record already exists for this employee today.');
    }

    const record = AttendanceRecord.clockIn({
      tenantId,
      employeeId,
      date: today,
      clockInTime: now,
    });

    await repository.save(record);
    for (const event of record.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: record.id.toValue() };
  }
}
