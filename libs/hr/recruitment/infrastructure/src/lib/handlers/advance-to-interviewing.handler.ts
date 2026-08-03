import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { AdvanceToInterviewingCommand } from '@abms/hr-recruitment-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmApplicationRepository } from '../repositories/typeorm-application.repository';

@Injectable()
@CommandHandler(AdvanceToInterviewingCommand)
export class AdvanceToInterviewingHandler extends TransactionalCommandHandler<
  AdvanceToInterviewingCommand,
  void
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: AdvanceToInterviewingCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmApplicationRepository(getEntityManager(ctx));

    const application = await repository.findById(EntityId.create(command.applicationId));
    if (!application) {
      throw new NotFoundDomainException('Application', command.applicationId);
    }

    application.advanceToInterviewing();

    await repository.save(application);
  }
}
