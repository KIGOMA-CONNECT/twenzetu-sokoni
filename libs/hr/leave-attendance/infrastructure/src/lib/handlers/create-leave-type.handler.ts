import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CreateLeaveTypeCommand, CreateLeaveTypeResult } from '@abms/hr-leave-attendance-application';
import { LeaveType } from '@abms/hr-leave-attendance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmLeaveTypeRepository } from '../repositories/typeorm-leave-type.repository';

@Injectable()
@CommandHandler(CreateLeaveTypeCommand)
export class CreateLeaveTypeHandler extends TransactionalCommandHandler<
  CreateLeaveTypeCommand,
  CreateLeaveTypeResult
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
    command: CreateLeaveTypeCommand,
    ctx: ITransactionContext,
  ): Promise<CreateLeaveTypeResult> {
    const repository = new TypeOrmLeaveTypeRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const existing = await repository.findByCode(tenantId, command.code);
    if (existing) {
      throw new BusinessRuleViolationException(`A leave type with code "${command.code}" already exists.`);
    }

    const leaveType = LeaveType.create({
      tenantId,
      code: command.code,
      name: command.name,
      defaultDaysPerYear: command.defaultDaysPerYear,
      requiresApproval: command.requiresApproval,
    });

    await repository.save(leaveType);
    for (const event of leaveType.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: leaveType.id.toValue() };
  }
}
