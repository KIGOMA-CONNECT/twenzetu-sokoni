import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CancelLeaveRequestCommand } from '@abms/hr-leave-attendance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmLeaveRequestRepository } from '../repositories/typeorm-leave-request.repository';

@Injectable()
@CommandHandler(CancelLeaveRequestCommand)
export class CancelLeaveRequestHandler extends TransactionalCommandHandler<CancelLeaveRequestCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CancelLeaveRequestCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmLeaveRequestRepository(getEntityManager(ctx));

    const requestId = EntityId.create(command.leaveRequestId);
    const request = await repository.findById(requestId);
    if (!request) {
      throw new NotFoundDomainException('LeaveRequest', command.leaveRequestId);
    }

    request.cancel();

    await repository.save(request);
    for (const event of request.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
