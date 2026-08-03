import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, Email, EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { UpdateEmployeePersonalDetailsCommand } from '@abms/hr-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmEmployeeRepository } from '../repositories/typeorm-employee.repository';

@Injectable()
@CommandHandler(UpdateEmployeePersonalDetailsCommand)
export class UpdateEmployeePersonalDetailsHandler extends TransactionalCommandHandler<
  UpdateEmployeePersonalDetailsCommand,
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

  protected async handle(
    command: UpdateEmployeePersonalDetailsCommand,
    ctx: ITransactionContext,
  ): Promise<void> {
    const repository = new TypeOrmEmployeeRepository(getEntityManager(ctx));

    const employeeId = EntityId.create(command.employeeId);
    const employee = await repository.findById(employeeId);
    if (!employee) {
      throw new NotFoundDomainException('Employee', command.employeeId);
    }

    let email: Email | undefined;
    if (command.email !== undefined) {
      const emailResult = Email.create(command.email);
      if (emailResult.isFailure) {
        throw new BusinessRuleViolationException(emailResult.getError().message);
      }
      email = emailResult.getValue();
    }

    employee.updatePersonalDetails({
      firstName: command.firstName,
      lastName: command.lastName,
      email,
      phone: command.phone,
      dateOfBirth: command.dateOfBirth !== undefined ? (command.dateOfBirth ? new Date(command.dateOfBirth) : null) : undefined,
      gender: command.gender,
    });

    await repository.save(employee);
  }
}
