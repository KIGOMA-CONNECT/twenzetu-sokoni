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
  NominateSuccessionCandidateCommand,
  NominateSuccessionCandidateResult,
} from '@abms/hr-succession-application';
import { SuccessionCandidate } from '@abms/hr-succession-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmSuccessionCandidateRepository } from '../repositories/typeorm-succession-candidate.repository';
import { TypeOrmSuccessionPlanRepository } from '../repositories/typeorm-succession-plan.repository';

@Injectable()
@CommandHandler(NominateSuccessionCandidateCommand)
export class NominateSuccessionCandidateHandler extends TransactionalCommandHandler<
  NominateSuccessionCandidateCommand,
  NominateSuccessionCandidateResult
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
    command: NominateSuccessionCandidateCommand,
    ctx: ITransactionContext,
  ): Promise<NominateSuccessionCandidateResult> {
    const manager = getEntityManager(ctx);
    const planRepository = new TypeOrmSuccessionPlanRepository(manager);
    const candidateRepository = new TypeOrmSuccessionCandidateRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const successionPlanId = EntityId.create(command.successionPlanId);
    const plan = await planRepository.findById(successionPlanId);
    if (!plan) {
      throw new NotFoundDomainException('SuccessionPlan', command.successionPlanId);
    }
    plan.assertOpen('nominate a candidate');

    const employeeId = EntityId.create(command.employeeId);
    const existing = await candidateRepository.findByPlanAndEmployee(tenantId, successionPlanId, employeeId);
    if (existing) {
      throw new BusinessRuleViolationException(
        'Employee is already nominated as a candidate for this succession plan.',
      );
    }

    const candidate = SuccessionCandidate.nominate({
      tenantId,
      successionPlanId,
      employeeId,
      readinessLevel: command.readinessLevel,
      notes: command.notes ?? null,
    });

    await candidateRepository.save(candidate);
    for (const event of candidate.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: candidate.id.toValue() };
  }
}
