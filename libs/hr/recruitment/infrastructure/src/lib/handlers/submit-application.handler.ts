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
import { SubmitApplicationCommand, SubmitApplicationResult } from '@abms/hr-recruitment-application';
import { Application } from '@abms/hr-recruitment-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmApplicationRepository } from '../repositories/typeorm-application.repository';
import { TypeOrmCandidateRepository } from '../repositories/typeorm-candidate.repository';
import { TypeOrmJobRequisitionRepository } from '../repositories/typeorm-job-requisition.repository';

@Injectable()
@CommandHandler(SubmitApplicationCommand)
export class SubmitApplicationHandler extends TransactionalCommandHandler<
  SubmitApplicationCommand,
  SubmitApplicationResult
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
    command: SubmitApplicationCommand,
    ctx: ITransactionContext,
  ): Promise<SubmitApplicationResult> {
    const manager = getEntityManager(ctx);
    const applicationRepository = new TypeOrmApplicationRepository(manager);
    const candidateRepository = new TypeOrmCandidateRepository(manager);
    const requisitionRepository = new TypeOrmJobRequisitionRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const candidateId = EntityId.create(command.candidateId);
    const candidate = await candidateRepository.findById(candidateId);
    if (!candidate) {
      throw new NotFoundDomainException('Candidate', command.candidateId);
    }

    const jobRequisitionId = EntityId.create(command.jobRequisitionId);
    const requisition = await requisitionRepository.findById(jobRequisitionId);
    if (!requisition) {
      throw new NotFoundDomainException('JobRequisition', command.jobRequisitionId);
    }
    requisition.assertOpen('accept a new application');

    const existingApplications = await applicationRepository.findAllByCandidate(tenantId, candidateId);
    if (existingApplications.some((app) => app.jobRequisitionId.equals(jobRequisitionId))) {
      throw new BusinessRuleViolationException(
        'This candidate has already applied to this job requisition.',
      );
    }

    const application = Application.submit({ tenantId, candidateId, jobRequisitionId });

    await applicationRepository.save(application);
    for (const event of application.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: application.id.toValue() };
  }
}
