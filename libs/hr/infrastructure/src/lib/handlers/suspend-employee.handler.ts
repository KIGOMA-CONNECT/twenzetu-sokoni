import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { SuspendEmployeeCommand } from '@abms/hr-application';
import { EmploymentHistoryEntry } from '@abms/hr-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmEmployeeRepository } from '../repositories/typeorm-employee.repository';
import { TypeOrmEmploymentHistoryRepository } from '../repositories/typeorm-employment-history.repository';

@Injectable()
@CommandHandler(SuspendEmployeeCommand)
export class SuspendEmployeeHandler extends TransactionalCommandHandler<SuspendEmployeeCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: SuspendEmployeeCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const employeeRepository = new TypeOrmEmployeeRepository(manager);
    const historyRepository = new TypeOrmEmploymentHistoryRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const employeeId = EntityId.create(command.employeeId);
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundDomainException('Employee', command.employeeId);
    }

    employee.suspend();

    await employeeRepository.save(employee);
    for (const event of employee.domainEvents) {
      ctx.addEvent(event);
    }

    await historyRepository.append(
      EmploymentHistoryEntry.create({
        tenantId,
        employeeId: employee.id,
        eventType: 'SUSPENDED',
        effectiveDate: new Date(),
        details: null,
      }),
    );
  }
}
