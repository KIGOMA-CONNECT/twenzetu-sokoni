import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ClockOutCommand } from '@abms/hr-leave-attendance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmAttendanceRecordRepository } from '../repositories/typeorm-attendance-record.repository';

@Injectable()
@CommandHandler(ClockOutCommand)
export class ClockOutHandler extends TransactionalCommandHandler<ClockOutCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: ClockOutCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmAttendanceRecordRepository(getEntityManager(ctx));

    const recordId = EntityId.create(command.attendanceRecordId);
    const record = await repository.findById(recordId);
    if (!record) {
      throw new NotFoundDomainException('AttendanceRecord', command.attendanceRecordId);
    }

    record.clockOut(new Date());

    await repository.save(record);
    for (const event of record.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
