import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { InitiateOffboardingCommand, InitiateOffboardingResult } from '@abms/hr-offboarding-application';
import { OffboardingCase, OffboardingTask } from '@abms/hr-offboarding-domain';
import { TypeOrmEmployeeRepository } from '@abms/hr-infrastructure';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOffboardingCaseRepository } from '../repositories/typeorm-offboarding-case.repository';
import { TypeOrmOffboardingTaskRepository } from '../repositories/typeorm-offboarding-task.repository';

const DEFAULT_OFFBOARDING_TASKS = [
  'Return company equipment',
  'Revoke system and building access',
  'Conduct exit interview',
  'Final payroll and benefits settlement',
];

@Injectable()
@CommandHandler(InitiateOffboardingCommand)
export class InitiateOffboardingHandler extends TransactionalCommandHandler<
  InitiateOffboardingCommand,
  InitiateOffboardingResult
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
    command: InitiateOffboardingCommand,
    ctx: ITransactionContext,
  ): Promise<InitiateOffboardingResult> {
    const manager = getEntityManager(ctx);
    const employeeRepository = new TypeOrmEmployeeRepository(manager);
    const caseRepository = new TypeOrmOffboardingCaseRepository(manager);
    const taskRepository = new TypeOrmOffboardingTaskRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const employeeId = EntityId.create(command.employeeId);
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundDomainException('Employee', command.employeeId);
    }
    if (employee.status === 'TERMINATED') {
      throw new BusinessRuleViolationException(
        `Employee "${employee.employeeNumber}" was already terminated.`,
      );
    }

    const existingActive = await caseRepository.findActiveByEmployee(tenantId, employeeId);
    if (existingActive) {
      throw new BusinessRuleViolationException(
        'An offboarding case is already in progress for this employee.',
      );
    }

    const offboardingCase = OffboardingCase.initiate({
      tenantId,
      employeeId,
      exitReason: command.exitReason,
      lastWorkingDay: new Date(command.lastWorkingDay),
    });

    await caseRepository.save(offboardingCase);
    for (const event of offboardingCase.domainEvents) {
      ctx.addEvent(event);
    }

    for (const taskName of DEFAULT_OFFBOARDING_TASKS) {
      await taskRepository.save(
        OffboardingTask.create({
          tenantId,
          offboardingCaseId: offboardingCase.id,
          employeeId,
          name: taskName,
        }),
      );
    }

    return { id: offboardingCase.id.toValue() };
  }
}
