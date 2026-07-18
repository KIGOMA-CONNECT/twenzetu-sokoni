import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { OpenJobRequisitionCommand, OpenJobRequisitionResult } from '@abms/hr-recruitment-application';
import { JobRequisition } from '@abms/hr-recruitment-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmJobRequisitionRepository } from '../repositories/typeorm-job-requisition.repository';

@Injectable()
@CommandHandler(OpenJobRequisitionCommand)
export class OpenJobRequisitionHandler extends TransactionalCommandHandler<
  OpenJobRequisitionCommand,
  OpenJobRequisitionResult
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
    command: OpenJobRequisitionCommand,
    ctx: ITransactionContext,
  ): Promise<OpenJobRequisitionResult> {
    const repository = new TypeOrmJobRequisitionRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const requisition = JobRequisition.open({
      tenantId,
      positionId: EntityId.create(command.positionId),
      title: command.title,
      headcount: command.headcount,
    });

    await repository.save(requisition);
    for (const event of requisition.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: requisition.id.toValue() };
  }
}
