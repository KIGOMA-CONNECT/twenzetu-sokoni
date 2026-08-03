import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CloseReviewCycleCommand } from '@abms/hr-performance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmReviewCycleRepository } from '../repositories/typeorm-review-cycle.repository';

@Injectable()
@CommandHandler(CloseReviewCycleCommand)
export class CloseReviewCycleHandler extends TransactionalCommandHandler<CloseReviewCycleCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CloseReviewCycleCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmReviewCycleRepository(getEntityManager(ctx));

    const cycle = await repository.findById(EntityId.create(command.reviewCycleId));
    if (!cycle) {
      throw new NotFoundDomainException('ReviewCycle', command.reviewCycleId);
    }

    cycle.close();

    await repository.save(cycle);
    for (const event of cycle.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
