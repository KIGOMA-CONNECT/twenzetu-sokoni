import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CompleteOffboardingCommand } from '@abms/hr-offboarding-application';
import { TypeOrmEmployeeRepository } from '@abms/hr-infrastructure';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOffboardingCaseRepository } from '../repositories/typeorm-offboarding-case.repository';

// Completing a case is the trigger that terminates the Employee — the direct
// cross-module Employee mutation (same EntityManager, same transaction) is
// the offboarding mirror of HireCandidateHandler's decision, documented in
// ADR-0011 point 1 and ADR-0013.
@Injectable()
@CommandHandler(CompleteOffboardingCommand)
export class CompleteOffboardingHandler extends TransactionalCommandHandler<CompleteOffboardingCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CompleteOffboardingCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const caseRepository = new TypeOrmOffboardingCaseRepository(manager);
    const employeeRepository = new TypeOrmEmployeeRepository(manager);

    const offboardingCase = await caseRepository.findById(EntityId.create(command.offboardingCaseId));
    if (!offboardingCase) {
      throw new NotFoundDomainException('OffboardingCase', command.offboardingCaseId);
    }

    offboardingCase.complete();

    const employee = await employeeRepository.findById(offboardingCase.employeeId);
    if (!employee) {
      throw new NotFoundDomainException('Employee', offboardingCase.employeeId.toValue());
    }
    employee.terminate(offboardingCase.lastWorkingDay);

    await employeeRepository.save(employee);
    for (const event of employee.domainEvents) {
      ctx.addEvent(event);
    }

    await caseRepository.save(offboardingCase);
    for (const event of offboardingCase.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
