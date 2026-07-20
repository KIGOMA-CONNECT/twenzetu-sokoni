import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { MarkComplianceRecordExemptCommand } from '@abms/hr-compliance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmEmployeeComplianceRecordRepository } from '../repositories/typeorm-employee-compliance-record.repository';

@Injectable()
@CommandHandler(MarkComplianceRecordExemptCommand)
export class MarkComplianceRecordExemptHandler extends TransactionalCommandHandler<
  MarkComplianceRecordExemptCommand,
  void
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: MarkComplianceRecordExemptCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmEmployeeComplianceRecordRepository(getEntityManager(ctx));

    const record = await repository.findById(EntityId.create(command.employeeComplianceRecordId));
    if (!record) {
      throw new NotFoundDomainException('EmployeeComplianceRecord', command.employeeComplianceRecordId);
    }

    record.markExempt(command.reason);

    await repository.save(record);
    for (const event of record.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
