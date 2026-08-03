import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { CurrencyCode, EntityId, ITransactionContext, Money } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { SetSalaryStructureCommand, SetSalaryStructureResult } from '@abms/hr-payroll-application';
import { SalaryStructure } from '@abms/hr-payroll-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmSalaryStructureRepository } from '../repositories/typeorm-salary-structure.repository';

// v1 is single-currency (TZS) per tenant — see ADR-0010. A future
// multi-currency sprint would add a currency field to the command instead of
// hardcoding it here.
const TZS = CurrencyCode.create('TZS').getValue();

@Injectable()
@CommandHandler(SetSalaryStructureCommand)
export class SetSalaryStructureHandler extends TransactionalCommandHandler<
  SetSalaryStructureCommand,
  SetSalaryStructureResult
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
    command: SetSalaryStructureCommand,
    ctx: ITransactionContext,
  ): Promise<SetSalaryStructureResult> {
    const repository = new TypeOrmSalaryStructureRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);
    const employeeId = EntityId.create(command.employeeId);

    const existing = await repository.findActiveByEmployee(tenantId, employeeId);
    if (existing) {
      existing.deactivate();
      await repository.save(existing);
    }

    const structure = SalaryStructure.create({
      tenantId,
      employeeId,
      basicSalary: Money.create(command.basicSalary.toString(), TZS).getValue(),
      allowances: command.allowances.map((allowance) => ({
        name: allowance.name,
        amount: Money.create(allowance.amount.toString(), TZS).getValue(),
      })),
      effectiveFrom: new Date(command.effectiveFrom),
    });

    await repository.save(structure);
    for (const event of structure.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: structure.id.toValue() };
  }
}
