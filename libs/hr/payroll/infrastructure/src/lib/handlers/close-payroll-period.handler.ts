import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ClosePayrollPeriodCommand } from '@abms/hr-payroll-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmPayrollPeriodRepository } from '../repositories/typeorm-payroll-period.repository';

@Injectable()
@CommandHandler(ClosePayrollPeriodCommand)
export class ClosePayrollPeriodHandler extends TransactionalCommandHandler<ClosePayrollPeriodCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: ClosePayrollPeriodCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmPayrollPeriodRepository(getEntityManager(ctx));

    const periodId = EntityId.create(command.payrollPeriodId);
    const period = await repository.findById(periodId);
    if (!period) {
      throw new NotFoundDomainException('PayrollPeriod', command.payrollPeriodId);
    }

    period.close();

    await repository.save(period);
    for (const event of period.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
