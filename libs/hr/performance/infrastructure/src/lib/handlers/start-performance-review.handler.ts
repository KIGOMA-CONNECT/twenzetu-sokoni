import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  BusinessRuleViolationException,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
} from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  StartPerformanceReviewCommand,
  StartPerformanceReviewResult,
} from '@abms/hr-performance-application';
import { PerformanceReview } from '@abms/hr-performance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmPerformanceReviewRepository } from '../repositories/typeorm-performance-review.repository';
import { TypeOrmReviewCycleRepository } from '../repositories/typeorm-review-cycle.repository';

@Injectable()
@CommandHandler(StartPerformanceReviewCommand)
export class StartPerformanceReviewHandler extends TransactionalCommandHandler<
  StartPerformanceReviewCommand,
  StartPerformanceReviewResult
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) private readonly currentUserProvider: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUserProvider, auditLogger);
  }

  protected async handle(
    command: StartPerformanceReviewCommand,
    ctx: ITransactionContext,
  ): Promise<StartPerformanceReviewResult> {
    const manager = getEntityManager(ctx);
    const cycleRepository = new TypeOrmReviewCycleRepository(manager);
    const reviewRepository = new TypeOrmPerformanceReviewRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const reviewCycleId = EntityId.create(command.reviewCycleId);
    const cycle = await cycleRepository.findById(reviewCycleId);
    if (!cycle) {
      throw new NotFoundDomainException('ReviewCycle', command.reviewCycleId);
    }
    cycle.assertOpen();

    const employeeId = EntityId.create(command.employeeId);
    const existing = await reviewRepository.findByEmployeeAndCycle(tenantId, employeeId, reviewCycleId);
    if (existing) {
      throw new BusinessRuleViolationException(
        'A performance review for this employee already exists in this review cycle.',
      );
    }

    const reviewerUserId = this.currentUserProvider.getCurrentUserId() ?? 'unknown';
    const review = PerformanceReview.start({ tenantId, employeeId, reviewCycleId, reviewerUserId });

    await reviewRepository.save(review);

    return { id: review.id.toValue() };
  }
}
