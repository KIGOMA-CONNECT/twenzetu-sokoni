import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { OpenPayrollPeriodCommand, OpenPayrollPeriodResult } from '@abms/hr-payroll-application';
import { PayrollPeriod } from '@abms/hr-payroll-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmPayrollPeriodRepository } from '../repositories/typeorm-payroll-period.repository';

@Injectable()
@CommandHandler(OpenPayrollPeriodCommand)
export class OpenPayrollPeriodHandler extends TransactionalCommandHandler<
  OpenPayrollPeriodCommand,
  OpenPayrollPeriodResult
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
    command: OpenPayrollPeriodCommand,
    ctx: ITransactionContext,
  ): Promise<OpenPayrollPeriodResult> {
    const repository = new TypeOrmPayrollPeriodRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const existing = await repository.findByYearAndMonth(tenantId, command.year, command.month);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A payroll period for ${command.year}-${command.month} already exists.`,
      );
    }

    const period = PayrollPeriod.open({ tenantId, year: command.year, month: command.month });

    await repository.save(period);
    for (const event of period.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: period.id.toValue() };
  }
}
