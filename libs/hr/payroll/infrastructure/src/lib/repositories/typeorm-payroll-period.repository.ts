import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { IPayrollPeriodRepository, PayrollPeriod, PayrollPeriodStatus } from '@abms/hr-payroll-domain';
import { EntityManager } from 'typeorm';
import { PayrollPeriodOrmEntity } from '../entities/payroll-period-orm.entity';

export class TypeOrmPayrollPeriodRepository
  extends TypeOrmRepository<PayrollPeriod, PayrollPeriodOrmEntity, EntityId>
  implements IPayrollPeriodRepository
{
  public constructor(manager: EntityManager) {
    super(manager, PayrollPeriodOrmEntity);
  }

  public async findById(id: EntityId): Promise<PayrollPeriod | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByYearAndMonth(
    tenantId: TenantId,
    year: number,
    month: number,
  ): Promise<PayrollPeriod | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, year, month } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<PayrollPeriod[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: PayrollPeriod): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      year: entity.year,
      month: entity.month,
      status: entity.status,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: PayrollPeriodOrmEntity): PayrollPeriod {
    return PayrollPeriod.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      year: row.year,
      month: row.month,
      status: row.status as PayrollPeriodStatus,
    });
  }
}
