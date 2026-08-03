import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { BusinessRuleViolationException, ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CreatePositionCommand, CreatePositionResult } from '@abms/hr-application';
import { Position } from '@abms/hr-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmPositionRepository } from '../repositories/typeorm-position.repository';

@Injectable()
@CommandHandler(CreatePositionCommand)
export class CreatePositionHandler extends TransactionalCommandHandler<
  CreatePositionCommand,
  CreatePositionResult
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
    command: CreatePositionCommand,
    ctx: ITransactionContext,
  ): Promise<CreatePositionResult> {
    const repository = new TypeOrmPositionRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const existing = await repository.findByCode(tenantId, command.code);
    if (existing) {
      throw new BusinessRuleViolationException(`A position with code "${command.code}" already exists.`);
    }

    const position = Position.create({
      tenantId,
      code: command.code,
      title: command.title,
      description: command.description ?? null,
    });

    await repository.save(position);
    for (const event of position.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: position.id.toValue() };
  }
}
