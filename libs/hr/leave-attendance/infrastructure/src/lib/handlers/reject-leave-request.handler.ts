import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { RejectLeaveRequestCommand } from '@abms/hr-leave-attendance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmLeaveRequestRepository } from '../repositories/typeorm-leave-request.repository';

@Injectable()
@CommandHandler(RejectLeaveRequestCommand)
export class RejectLeaveRequestHandler extends TransactionalCommandHandler<RejectLeaveRequestCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) private readonly currentUserProvider: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUserProvider, auditLogger);
  }

  protected async handle(command: RejectLeaveRequestCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmLeaveRequestRepository(getEntityManager(ctx));

    const requestId = EntityId.create(command.leaveRequestId);
    const request = await repository.findById(requestId);
    if (!request) {
      throw new NotFoundDomainException('LeaveRequest', command.leaveRequestId);
    }

    const rejectedByUserId = this.currentUserProvider.getCurrentUserId() ?? 'unknown';
    request.reject(rejectedByUserId, command.comment ?? null);

    await repository.save(request);
    for (const event of request.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
