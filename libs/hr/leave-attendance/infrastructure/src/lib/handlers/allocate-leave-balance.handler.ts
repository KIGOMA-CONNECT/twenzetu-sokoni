import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, EntityId, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { AllocateLeaveBalanceCommand, AllocateLeaveBalanceResult } from '@abms/hr-leave-attendance-application';
import { LeaveBalance } from '@abms/hr-leave-attendance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmLeaveBalanceRepository } from '../repositories/typeorm-leave-balance.repository';

@Injectable()
@CommandHandler(AllocateLeaveBalanceCommand)
export class AllocateLeaveBalanceHandler extends TransactionalCommandHandler<
  AllocateLeaveBalanceCommand,
  AllocateLeaveBalanceResult
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
    command: AllocateLeaveBalanceCommand,
    ctx: ITransactionContext,
  ): Promise<AllocateLeaveBalanceResult> {
    const repository = new TypeOrmLeaveBalanceRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);
    const employeeId = EntityId.create(command.employeeId);
    const leaveTypeId = EntityId.create(command.leaveTypeId);

    const existing = await repository.findByEmployeeLeaveTypeAndYear(
      tenantId,
      employeeId,
      leaveTypeId,
      command.year,
    );
    if (existing) {
      throw new BusinessRuleViolationException(
        `A leave balance for this employee/leave-type/year (${command.year}) already exists.`,
      );
    }

    const balance = LeaveBalance.create({
      tenantId,
      employeeId,
      leaveTypeId,
      year: command.year,
      allocatedDays: command.allocatedDays,
    });

    await repository.save(balance);

    return { id: balance.id.toValue() };
  }
}
