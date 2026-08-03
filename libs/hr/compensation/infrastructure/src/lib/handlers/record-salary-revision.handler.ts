import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { CurrencyCode, EntityId, ITransactionContext, Money, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { RecordSalaryRevisionCommand, RecordSalaryRevisionResult } from '@abms/hr-compensation-application';
import { SalaryRevision } from '@abms/hr-compensation-domain';
import { TypeOrmSalaryStructureRepository } from '@abms/hr-payroll-infrastructure';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmSalaryRevisionRepository } from '../repositories/typeorm-salary-revision.repository';

// v1 is single-currency (TZS) per tenant — matches Payroll's own hardcoded
// convention (SetSalaryStructureHandler, ADR-0010).
const TZS = CurrencyCode.create('TZS').getValue();

// Directly mutates the active SalaryStructure (@abms/hr-payroll-domain) in
// the same transaction, then appends the WORM SalaryRevision fact — the
// compensation mirror of Recruitment's/Offboarding's cross-module Employee
// mutation pattern (ADR-0011 point 1, ADR-0013 point 1). See ADR-0014.
@Injectable()
@CommandHandler(RecordSalaryRevisionCommand)
export class RecordSalaryRevisionHandler extends TransactionalCommandHandler<
  RecordSalaryRevisionCommand,
  RecordSalaryRevisionResult
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
    command: RecordSalaryRevisionCommand,
    ctx: ITransactionContext,
  ): Promise<RecordSalaryRevisionResult> {
    const manager = getEntityManager(ctx);
    const salaryStructureRepository = new TypeOrmSalaryStructureRepository(manager);
    const salaryRevisionRepository = new TypeOrmSalaryRevisionRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);
    const employeeId = EntityId.create(command.employeeId);

    const structure = await salaryStructureRepository.findActiveByEmployee(tenantId, employeeId);
    if (!structure) {
      throw new NotFoundDomainException('SalaryStructure', command.employeeId);
    }

    const previousBasicSalary = structure.basicSalary;
    const newBasicSalary = Money.create(command.newBasicSalary.toString(), TZS).getValue();

    structure.updateBasicSalary(newBasicSalary);
    await salaryStructureRepository.save(structure);

    const revision = SalaryRevision.record({
      tenantId,
      employeeId,
      reason: command.reason,
      previousBasicSalary,
      newBasicSalary,
      effectiveDate: new Date(command.effectiveDate),
    });
    await salaryRevisionRepository.append(revision);

    return { id: revision.id.toValue() };
  }
}
