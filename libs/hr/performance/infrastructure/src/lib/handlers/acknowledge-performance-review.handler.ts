import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { AcknowledgePerformanceReviewCommand } from '@abms/hr-performance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmPerformanceReviewRepository } from '../repositories/typeorm-performance-review.repository';

@Injectable()
@CommandHandler(AcknowledgePerformanceReviewCommand)
export class AcknowledgePerformanceReviewHandler extends TransactionalCommandHandler<
  AcknowledgePerformanceReviewCommand,
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

  protected async handle(
    command: AcknowledgePerformanceReviewCommand,
    ctx: ITransactionContext,
  ): Promise<void> {
    const repository = new TypeOrmPerformanceReviewRepository(getEntityManager(ctx));

    const review = await repository.findById(EntityId.create(command.performanceReviewId));
    if (!review) {
      throw new NotFoundDomainException('PerformanceReview', command.performanceReviewId);
    }

    review.acknowledge();

    await repository.save(review);
    for (const event of review.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
