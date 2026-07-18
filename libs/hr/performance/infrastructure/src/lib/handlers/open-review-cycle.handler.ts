import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { OpenReviewCycleCommand, OpenReviewCycleResult } from '@abms/hr-performance-application';
import { ReviewCycle } from '@abms/hr-performance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmReviewCycleRepository } from '../repositories/typeorm-review-cycle.repository';

@Injectable()
@CommandHandler(OpenReviewCycleCommand)
export class OpenReviewCycleHandler extends TransactionalCommandHandler<
  OpenReviewCycleCommand,
  OpenReviewCycleResult
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
    command: OpenReviewCycleCommand,
    ctx: ITransactionContext,
  ): Promise<OpenReviewCycleResult> {
    const repository = new TypeOrmReviewCycleRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const cycle = ReviewCycle.open({
      tenantId,
      name: command.name,
      startDate: new Date(command.startDate),
      endDate: new Date(command.endDate),
    });

    await repository.save(cycle);
    for (const event of cycle.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: cycle.id.toValue() };
  }
}
