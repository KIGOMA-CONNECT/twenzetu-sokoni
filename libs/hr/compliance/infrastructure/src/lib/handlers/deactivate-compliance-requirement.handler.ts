import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { DeactivateComplianceRequirementCommand } from '@abms/hr-compliance-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmComplianceRequirementRepository } from '../repositories/typeorm-compliance-requirement.repository';

@Injectable()
@CommandHandler(DeactivateComplianceRequirementCommand)
export class DeactivateComplianceRequirementHandler extends TransactionalCommandHandler<
  DeactivateComplianceRequirementCommand,
  void
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: DeactivateComplianceRequirementCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmComplianceRequirementRepository(getEntityManager(ctx));

    const requirement = await repository.findById(EntityId.create(command.complianceRequirementId));
    if (!requirement) {
      throw new NotFoundDomainException('ComplianceRequirement', command.complianceRequirementId);
    }

    requirement.deactivate();

    await repository.save(requirement);
    for (const event of requirement.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
