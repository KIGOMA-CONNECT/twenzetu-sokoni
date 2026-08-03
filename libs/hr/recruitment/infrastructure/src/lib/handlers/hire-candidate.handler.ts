import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { HireCandidateCommand, HireCandidateResult } from '@abms/hr-recruitment-application';
import { OnboardingTask } from '@abms/hr-recruitment-domain';
import { Employee, EmploymentHistoryEntry } from '@abms/hr-domain';
import { TypeOrmEmployeeRepository, TypeOrmEmploymentHistoryRepository } from '@abms/hr-infrastructure';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmApplicationRepository } from '../repositories/typeorm-application.repository';
import { TypeOrmCandidateRepository } from '../repositories/typeorm-candidate.repository';
import { TypeOrmJobRequisitionRepository } from '../repositories/typeorm-job-requisition.repository';
import { TypeOrmOnboardingTaskRepository } from '../repositories/typeorm-onboarding-task.repository';

const DEFAULT_ONBOARDING_TASKS = [
  'Collect signed employment contract',
  'IT equipment and account setup',
  'HR orientation session',
  'Introduce to manager and team',
];

@Injectable()
@CommandHandler(HireCandidateCommand)
export class HireCandidateHandler extends TransactionalCommandHandler<
  HireCandidateCommand,
  HireCandidateResult
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
    command: HireCandidateCommand,
    ctx: ITransactionContext,
  ): Promise<HireCandidateResult> {
    const manager = getEntityManager(ctx);
    const applicationRepository = new TypeOrmApplicationRepository(manager);
    const candidateRepository = new TypeOrmCandidateRepository(manager);
    const requisitionRepository = new TypeOrmJobRequisitionRepository(manager);
    const employeeRepository = new TypeOrmEmployeeRepository(manager);
    const historyRepository = new TypeOrmEmploymentHistoryRepository(manager);
    const onboardingTaskRepository = new TypeOrmOnboardingTaskRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const applicationId = EntityId.create(command.applicationId);
    const application = await applicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundDomainException('Application', command.applicationId);
    }

    const candidate = await candidateRepository.findById(application.candidateId);
    if (!candidate) {
      throw new NotFoundDomainException('Candidate', application.candidateId.toValue());
    }

    const requisition = await requisitionRepository.findById(application.jobRequisitionId);
    if (!requisition) {
      throw new NotFoundDomainException('JobRequisition', application.jobRequisitionId.toValue());
    }

    // Mutate and persist the Application first — hire() itself enforces the
    // OFFERED precondition, so a failed uniqueness check below still leaves
    // the application untouched (the whole handler is one transaction, so
    // either everything commits or nothing does).
    application.hire();

    const existingByNumber = await employeeRepository.findByEmployeeNumber(tenantId, command.employeeNumber);
    if (existingByNumber) {
      throw new BusinessRuleViolationException(
        `An employee with number "${command.employeeNumber}" already exists.`,
      );
    }
    const existingByEmail = await employeeRepository.findByEmail(tenantId, candidate.email);
    if (existingByEmail) {
      throw new BusinessRuleViolationException(
        `An employee with email "${candidate.email.value}" already exists.`,
      );
    }

    const employee = Employee.create({
      tenantId,
      userId: null,
      employeeNumber: command.employeeNumber,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      dateOfBirth: null,
      gender: null,
      positionId: requisition.positionId,
      orgUnitId: command.orgUnitId ?? null,
      hireDate: new Date(command.hireDate),
      employmentType: command.employmentType,
    });

    await employeeRepository.save(employee);
    for (const event of employee.domainEvents) {
      ctx.addEvent(event);
    }

    await historyRepository.append(
      EmploymentHistoryEntry.create({
        tenantId,
        employeeId: employee.id,
        eventType: 'HIRED',
        effectiveDate: employee.hireDate,
        details: `Hired via recruitment application "${application.id.toValue()}" for requisition "${requisition.title}".`,
      }),
    );

    for (const taskName of DEFAULT_ONBOARDING_TASKS) {
      await onboardingTaskRepository.save(
        OnboardingTask.create({ tenantId, employeeId: employee.id, name: taskName }),
      );
    }

    await applicationRepository.save(application);
    for (const event of application.domainEvents) {
      ctx.addEvent(event);
    }

    return { employeeId: employee.id.toValue() };
  }
}
