import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { LinkEmployeeUserAccountCommand } from '@abms/hr-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmEmployeeRepository } from '../repositories/typeorm-employee.repository';

@Injectable()
@CommandHandler(LinkEmployeeUserAccountCommand)
export class LinkEmployeeUserAccountHandler extends TransactionalCommandHandler<
  LinkEmployeeUserAccountCommand,
  void
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContext: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContext, currentUser, auditLogger);
  }

  protected async handle(command: LinkEmployeeUserAccountCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmEmployeeRepository(getEntityManager(ctx));

    const employeeId = EntityId.create(command.employeeId);
    const employee = await repository.findById(employeeId);
    if (!employee) {
      throw new NotFoundDomainException('Employee', command.employeeId);
    }

    employee.linkUserAccount(command.userId);
    await repository.save(employee);
  }
}
