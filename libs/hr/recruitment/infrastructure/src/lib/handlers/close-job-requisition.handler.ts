import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CloseJobRequisitionCommand } from '@abms/hr-recruitment-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmJobRequisitionRepository } from '../repositories/typeorm-job-requisition.repository';

@Injectable()
@CommandHandler(CloseJobRequisitionCommand)
export class CloseJobRequisitionHandler extends TransactionalCommandHandler<CloseJobRequisitionCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CloseJobRequisitionCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmJobRequisitionRepository(getEntityManager(ctx));

    const requisitionId = EntityId.create(command.jobRequisitionId);
    const requisition = await repository.findById(requisitionId);
    if (!requisition) {
      throw new NotFoundDomainException('JobRequisition', command.jobRequisitionId);
    }

    requisition.close(command.reason);

    await repository.save(requisition);
    for (const event of requisition.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
