import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { UpdateCandidateReadinessCommand } from '@abms/hr-succession-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmSuccessionCandidateRepository } from '../repositories/typeorm-succession-candidate.repository';

@Injectable()
@CommandHandler(UpdateCandidateReadinessCommand)
export class UpdateCandidateReadinessHandler extends TransactionalCommandHandler<
  UpdateCandidateReadinessCommand,
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

  protected async handle(command: UpdateCandidateReadinessCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmSuccessionCandidateRepository(getEntityManager(ctx));

    const candidate = await repository.findById(EntityId.create(command.successionCandidateId));
    if (!candidate) {
      throw new NotFoundDomainException('SuccessionCandidate', command.successionCandidateId);
    }

    candidate.updateReadiness(command.readinessLevel, command.notes);

    await repository.save(candidate);
    for (const event of candidate.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
