import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { RemoveSuccessionCandidateCommand } from '@abms/hr-succession-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmSuccessionCandidateRepository } from '../repositories/typeorm-succession-candidate.repository';

@Injectable()
@CommandHandler(RemoveSuccessionCandidateCommand)
export class RemoveSuccessionCandidateHandler extends TransactionalCommandHandler<
  RemoveSuccessionCandidateCommand,
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

  protected async handle(command: RemoveSuccessionCandidateCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmSuccessionCandidateRepository(getEntityManager(ctx));

    const candidateId = EntityId.create(command.successionCandidateId);
    const candidate = await repository.findById(candidateId);
    if (!candidate) {
      throw new NotFoundDomainException('SuccessionCandidate', command.successionCandidateId);
    }

    await repository.delete(candidateId);
  }
}
