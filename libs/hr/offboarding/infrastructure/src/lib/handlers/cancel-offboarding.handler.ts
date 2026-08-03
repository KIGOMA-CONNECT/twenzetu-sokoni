import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CancelOffboardingCommand } from '@abms/hr-offboarding-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOffboardingCaseRepository } from '../repositories/typeorm-offboarding-case.repository';

@Injectable()
@CommandHandler(CancelOffboardingCommand)
export class CancelOffboardingHandler extends TransactionalCommandHandler<CancelOffboardingCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CancelOffboardingCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmOffboardingCaseRepository(getEntityManager(ctx));

    const offboardingCase = await repository.findById(EntityId.create(command.offboardingCaseId));
    if (!offboardingCase) {
      throw new NotFoundDomainException('OffboardingCase', command.offboardingCaseId);
    }

    offboardingCase.cancel();

    await repository.save(offboardingCase);
    for (const event of offboardingCase.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
