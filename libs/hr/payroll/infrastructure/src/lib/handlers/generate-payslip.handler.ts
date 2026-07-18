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
import { GeneratePayslipCommand, GeneratePayslipResult } from '@abms/hr-payroll-application';
import { createTanzaniaStatutoryRatesV1, Payslip } from '@abms/hr-payroll-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmPayrollPeriodRepository } from '../repositories/typeorm-payroll-period.repository';
import { TypeOrmPayslipRepository } from '../repositories/typeorm-payslip.repository';
import { TypeOrmSalaryStructureRepository } from '../repositories/typeorm-salary-structure.repository';

@Injectable()
@CommandHandler(GeneratePayslipCommand)
export class GeneratePayslipHandler extends TransactionalCommandHandler<
  GeneratePayslipCommand,
  GeneratePayslipResult
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
    command: GeneratePayslipCommand,
    ctx: ITransactionContext,
  ): Promise<GeneratePayslipResult> {
    const manager = getEntityManager(ctx);
    const periodRepository = new TypeOrmPayrollPeriodRepository(manager);
    const structureRepository = new TypeOrmSalaryStructureRepository(manager);
    const payslipRepository = new TypeOrmPayslipRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const periodId = EntityId.create(command.payrollPeriodId);
    const period = await periodRepository.findById(periodId);
    if (!period) {
      throw new NotFoundDomainException('PayrollPeriod', command.payrollPeriodId);
    }
    period.assertOpen();

    const employeeId = EntityId.create(command.employeeId);
    const structure = await structureRepository.findActiveByEmployee(tenantId, employeeId);
    if (!structure) {
      throw new NotFoundDomainException('SalaryStructure', `active structure for employee ${command.employeeId}`);
    }

    const existing = await payslipRepository.findByEmployeeAndPeriod(tenantId, employeeId, periodId);
    if (existing) {
      throw new BusinessRuleViolationException(
        `A payslip for this employee in payroll period ${command.payrollPeriodId} already exists.`,
      );
    }

    const payslip = Payslip.generate({
      tenantId,
      employeeId,
      payrollPeriodId: periodId,
      basicSalary: structure.basicSalary,
      allowances: structure.allowances,
      statutoryRates: createTanzaniaStatutoryRatesV1(),
    });

    await payslipRepository.save(payslip);
    for (const event of payslip.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: payslip.id.toValue() };
  }
}
