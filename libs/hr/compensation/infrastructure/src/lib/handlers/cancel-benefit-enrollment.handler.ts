import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CancelBenefitEnrollmentCommand } from '@abms/hr-compensation-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmBenefitEnrollmentRepository } from '../repositories/typeorm-benefit-enrollment.repository';

@Injectable()
@CommandHandler(CancelBenefitEnrollmentCommand)
export class CancelBenefitEnrollmentHandler extends TransactionalCommandHandler<
  CancelBenefitEnrollmentCommand,
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

  protected async handle(command: CancelBenefitEnrollmentCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmBenefitEnrollmentRepository(getEntityManager(ctx));

    const enrollment = await repository.findById(EntityId.create(command.benefitEnrollmentId));
    if (!enrollment) {
      throw new NotFoundDomainException('BenefitEnrollment', command.benefitEnrollmentId);
    }

    enrollment.cancel();

    await repository.save(enrollment);
    for (const event of enrollment.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
