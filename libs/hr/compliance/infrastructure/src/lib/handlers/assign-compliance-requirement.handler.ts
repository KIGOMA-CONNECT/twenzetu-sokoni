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
import {
  AssignComplianceRequirementCommand,
  AssignComplianceRequirementResult,
} from '@abms/hr-compliance-application';
import { EmployeeComplianceRecord } from '@abms/hr-compliance-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmComplianceRequirementRepository } from '../repositories/typeorm-compliance-requirement.repository';
import { TypeOrmEmployeeComplianceRecordRepository } from '../repositories/typeorm-employee-compliance-record.repository';

@Injectable()
@CommandHandler(AssignComplianceRequirementCommand)
export class AssignComplianceRequirementHandler extends TransactionalCommandHandler<
  AssignComplianceRequirementCommand,
  AssignComplianceRequirementResult
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
    command: AssignComplianceRequirementCommand,
    ctx: ITransactionContext,
  ): Promise<AssignComplianceRequirementResult> {
    const manager = getEntityManager(ctx);
    const requirementRepository = new TypeOrmComplianceRequirementRepository(manager);
    const recordRepository = new TypeOrmEmployeeComplianceRecordRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const requirementId = EntityId.create(command.complianceRequirementId);
    const requirement = await requirementRepository.findById(requirementId);
    if (!requirement) {
      throw new NotFoundDomainException('ComplianceRequirement', command.complianceRequirementId);
    }
    requirement.assertActive('assign to an employee');

    const employeeId = EntityId.create(command.employeeId);
    const existing = await recordRepository.findPendingByEmployeeAndRequirement(
      tenantId,
      employeeId,
      requirementId,
    );
    if (existing) {
      throw new BusinessRuleViolationException(
        'Employee already has a pending compliance record for this requirement.',
      );
    }

    const record = EmployeeComplianceRecord.assign({
      tenantId,
      employeeId,
      complianceRequirementId: requirementId,
      dueDate: new Date(command.dueDate),
    });

    await recordRepository.save(record);
    for (const event of record.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: record.id.toValue() };
  }
}
