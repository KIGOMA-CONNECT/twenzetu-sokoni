import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, Email, EntityId, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CreateEmployeeCommand, CreateEmployeeResult } from '@abms/hr-application';
import { Employee, EmploymentHistoryEntry } from '@abms/hr-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmEmployeeRepository } from '../repositories/typeorm-employee.repository';
import { TypeOrmEmploymentHistoryRepository } from '../repositories/typeorm-employment-history.repository';

@Injectable()
@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeHandler extends TransactionalCommandHandler<
  CreateEmployeeCommand,
  CreateEmployeeResult
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
    command: CreateEmployeeCommand,
    ctx: ITransactionContext,
  ): Promise<CreateEmployeeResult> {
    const manager = getEntityManager(ctx);
    const employeeRepository = new TypeOrmEmployeeRepository(manager);
    const historyRepository = new TypeOrmEmploymentHistoryRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const emailResult = Email.create(command.email);
    if (emailResult.isFailure) {
      throw new BusinessRuleViolationException(emailResult.getError().message);
    }
    const email = emailResult.getValue();

    const existingByNumber = await employeeRepository.findByEmployeeNumber(tenantId, command.employeeNumber);
    if (existingByNumber) {
      throw new BusinessRuleViolationException(
        `An employee with number "${command.employeeNumber}" already exists.`,
      );
    }
    const existingByEmail = await employeeRepository.findByEmail(tenantId, email);
    if (existingByEmail) {
      throw new BusinessRuleViolationException(`An employee with email "${command.email}" already exists.`);
    }

    const employee = Employee.create({
      tenantId,
      userId: command.userId ?? null,
      employeeNumber: command.employeeNumber,
      firstName: command.firstName,
      lastName: command.lastName,
      email,
      phone: command.phone ?? null,
      dateOfBirth: command.dateOfBirth ? new Date(command.dateOfBirth) : null,
      gender: command.gender ?? null,
      positionId: command.positionId ? EntityId.create(command.positionId) : null,
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
        details: `Hired as employee "${employee.employeeNumber}".`,
      }),
    );

    return { id: employee.id.toValue() };
  }
}
