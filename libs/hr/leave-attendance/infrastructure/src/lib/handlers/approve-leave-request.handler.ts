import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ApproveLeaveRequestCommand } from '@abms/hr-leave-attendance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmLeaveBalanceRepository } from '../repositories/typeorm-leave-balance.repository';
import { TypeOrmLeaveRequestRepository } from '../repositories/typeorm-leave-request.repository';

@Injectable()
@CommandHandler(ApproveLeaveRequestCommand)
export class ApproveLeaveRequestHandler extends TransactionalCommandHandler<ApproveLeaveRequestCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) private readonly currentUserProvider: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUserProvider, auditLogger);
  }

  protected async handle(command: ApproveLeaveRequestCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const requestRepository = new TypeOrmLeaveRequestRepository(manager);
    const balanceRepository = new TypeOrmLeaveBalanceRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const requestId = EntityId.create(command.leaveRequestId);
    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundDomainException('LeaveRequest', command.leaveRequestId);
    }

    const balance = await balanceRepository.findByEmployeeLeaveTypeAndYear(
      tenantId,
      request.employeeId,
      request.leaveTypeId,
      request.startDate.getUTCFullYear(),
    );
    if (!balance) {
      throw new NotFoundDomainException('LeaveBalance', 'for this employee/leave-type/year');
    }

    balance.debit(request.numberOfDays);
    await balanceRepository.save(balance);

    const approvedByUserId = this.currentUserProvider.getCurrentUserId() ?? 'unknown';
    request.approve(approvedByUserId, command.comment ?? null);

    await requestRepository.save(request);
    for (const event of request.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
