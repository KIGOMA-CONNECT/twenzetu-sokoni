import { CurrencyCode, EntityId, TenantId } from '@abms/kernel';
import { ISalaryRevisionRepository, SalaryRevision, SalaryRevisionReason } from '@abms/hr-compensation-domain';
import { EntityManager } from 'typeorm';
import { SalaryRevisionOrmEntity } from '../entities/salary-revision-orm.entity';
import { toMoney } from './money.mapper';

export class TypeOrmSalaryRevisionRepository implements ISalaryRevisionRepository {
  private readonly repository;

  public constructor(manager: EntityManager) {
    this.repository = manager.getRepository(SalaryRevisionOrmEntity);
  }

  public async append(entry: SalaryRevision): Promise<void> {
    await this.repository.insert({
      id: entry.id.toValue(),
      tenantId: entry.tenantId.value,
      employeeId: entry.employeeId.toValue(),
      reason: entry.reason,
      previousBasicSalary: entry.previousBasicSalary.amount,
      newBasicSalary: entry.newBasicSalary.amount,
      currency: entry.newBasicSalary.currency.value,
      effectiveDate: entry.effectiveDate.toISOString().slice(0, 10),
    });
  }

  public async findByEmployeeId(tenantId: TenantId, employeeId: EntityId): Promise<SalaryRevision[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: SalaryRevisionOrmEntity): SalaryRevision {
    const currency = CurrencyCode.create(row.currency).getValue();
    return SalaryRevision.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      reason: row.reason as SalaryRevisionReason,
      previousBasicSalary: toMoney(row.previousBasicSalary, currency),
      newBasicSalary: toMoney(row.newBasicSalary, currency),
      effectiveDate: new Date(row.effectiveDate),
    });
  }
}
