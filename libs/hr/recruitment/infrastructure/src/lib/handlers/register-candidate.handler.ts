import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, Email, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { RegisterCandidateCommand, RegisterCandidateResult } from '@abms/hr-recruitment-application';
import { Candidate } from '@abms/hr-recruitment-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmCandidateRepository } from '../repositories/typeorm-candidate.repository';

@Injectable()
@CommandHandler(RegisterCandidateCommand)
export class RegisterCandidateHandler extends TransactionalCommandHandler<
  RegisterCandidateCommand,
  RegisterCandidateResult
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
    command: RegisterCandidateCommand,
    ctx: ITransactionContext,
  ): Promise<RegisterCandidateResult> {
    const repository = new TypeOrmCandidateRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const emailResult = Email.create(command.email);
    if (emailResult.isFailure) {
      throw new BusinessRuleViolationException(emailResult.getError().message);
    }

    const candidate = Candidate.register({
      tenantId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: emailResult.getValue(),
      phone: command.phone ?? null,
      resumeUrl: command.resumeUrl ?? null,
      source: command.source ?? null,
    });

    await repository.save(candidate);
    for (const event of candidate.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: candidate.id.toValue() };
  }
}
