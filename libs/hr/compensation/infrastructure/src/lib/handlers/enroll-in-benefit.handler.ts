import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  BusinessRuleViolationException,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
} from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { EnrollInBenefitCommand, EnrollInBenefitResult } from '@abms/hr-compensation-application';
import { BenefitEnrollment } from '@abms/hr-compensation-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmBenefitEnrollmentRepository } from '../repositories/typeorm-benefit-enrollment.repository';
import { TypeOrmBenefitPlanRepository } from '../repositories/typeorm-benefit-plan.repository';

@Injectable()
@CommandHandler(EnrollInBenefitCommand)
export class EnrollInBenefitHandler extends TransactionalCommandHandler<
  EnrollInBenefitCommand,
  EnrollInBenefitResult
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
    command: EnrollInBenefitCommand,
    ctx: ITransactionContext,
  ): Promise<EnrollInBenefitResult> {
    const manager = getEntityManager(ctx);
    const planRepository = new TypeOrmBenefitPlanRepository(manager);
    const enrollmentRepository = new TypeOrmBenefitEnrollmentRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const benefitPlanId = EntityId.create(command.benefitPlanId);
    const plan = await planRepository.findById(benefitPlanId);
    if (!plan) {
      throw new NotFoundDomainException('BenefitPlan', command.benefitPlanId);
    }
    plan.assertActive('enroll an employee');

    const employeeId = EntityId.create(command.employeeId);
    const existing = await enrollmentRepository.findActiveByEmployeeAndPlan(tenantId, employeeId, benefitPlanId);
    if (existing) {
      throw new BusinessRuleViolationException('Employee is already actively enrolled in this benefit plan.');
    }

    const enrollment = BenefitEnrollment.enroll({
      tenantId,
      employeeId,
      benefitPlanId,
      effectiveDate: new Date(command.effectiveDate),
    });

    await enrollmentRepository.save(enrollment);
    for (const event of enrollment.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: enrollment.id.toValue() };
  }
}
