import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  CreateComplianceRequirementCommand,
  CreateComplianceRequirementResult,
} from '@abms/hr-compliance-application';
import { ComplianceRequirement } from '@abms/hr-compliance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmComplianceRequirementRepository } from '../repositories/typeorm-compliance-requirement.repository';

@Injectable()
@CommandHandler(CreateComplianceRequirementCommand)
export class CreateComplianceRequirementHandler extends TransactionalCommandHandler<
  CreateComplianceRequirementCommand,
  CreateComplianceRequirementResult
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
    command: CreateComplianceRequirementCommand,
    ctx: ITransactionContext,
  ): Promise<CreateComplianceRequirementResult> {
    const repository = new TypeOrmComplianceRequirementRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const requirement = ComplianceRequirement.create({
      tenantId,
      name: command.name,
      description: command.description ?? null,
      category: command.category,
      recurrence: command.recurrence,
    });

    await repository.save(requirement);
    for (const event of requirement.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: requirement.id.toValue() };
  }
}
