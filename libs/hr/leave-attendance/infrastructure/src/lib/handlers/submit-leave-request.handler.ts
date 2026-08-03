import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { SubmitLeaveRequestCommand, SubmitLeaveRequestResult } from '@abms/hr-leave-attendance-application';
import { LeaveRequest } from '@abms/hr-leave-attendance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmLeaveRequestRepository } from '../repositories/typeorm-leave-request.repository';

@Injectable()
@CommandHandler(SubmitLeaveRequestCommand)
export class SubmitLeaveRequestHandler extends TransactionalCommandHandler<
  SubmitLeaveRequestCommand,
  SubmitLeaveRequestResult
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
    command: SubmitLeaveRequestCommand,
    ctx: ITransactionContext,
  ): Promise<SubmitLeaveRequestResult> {
    const repository = new TypeOrmLeaveRequestRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const request = LeaveRequest.submit({
      tenantId,
      employeeId: EntityId.create(command.employeeId),
      leaveTypeId: EntityId.create(command.leaveTypeId),
      startDate: new Date(command.startDate),
      endDate: new Date(command.endDate),
      numberOfDays: command.numberOfDays,
      reason: command.reason ?? null,
    });

    await repository.save(request);
    for (const event of request.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: request.id.toValue() };
  }
}
