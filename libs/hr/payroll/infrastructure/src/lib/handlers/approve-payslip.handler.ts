import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ApprovePayslipCommand } from '@abms/hr-payroll-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmPayslipRepository } from '../repositories/typeorm-payslip.repository';

@Injectable()
@CommandHandler(ApprovePayslipCommand)
export class ApprovePayslipHandler extends TransactionalCommandHandler<ApprovePayslipCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) private readonly currentUserProvider: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUserProvider, auditLogger);
  }

  protected async handle(command: ApprovePayslipCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmPayslipRepository(getEntityManager(ctx));

    const payslipId = EntityId.create(command.payslipId);
    const payslip = await repository.findById(payslipId);
    if (!payslip) {
      throw new NotFoundDomainException('Payslip', command.payslipId);
    }

    const approvedByUserId = this.currentUserProvider.getCurrentUserId() ?? 'unknown';
    payslip.approve(approvedByUserId);

    await repository.save(payslip);
    for (const event of payslip.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
