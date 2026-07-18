import { TypeOrmRepository } from '@abms/database';
import { CurrencyCode, EntityId, TenantId } from '@abms/kernel';
import { ISalaryStructureRepository, SalaryStructure } from '@abms/hr-payroll-domain';
import { EntityManager } from 'typeorm';
import { SalaryStructureOrmEntity } from '../entities/salary-structure-orm.entity';
import { toAllowanceLineJson, toAllowanceLines, toMoney } from './money-json.mapper';

export class TypeOrmSalaryStructureRepository
  extends TypeOrmRepository<SalaryStructure, SalaryStructureOrmEntity, EntityId>
  implements ISalaryStructureRepository
{
  public constructor(manager: EntityManager) {
    super(manager, SalaryStructureOrmEntity);
  }

  public async findById(id: EntityId): Promise<SalaryStructure | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findActiveByEmployee(
    tenantId: TenantId,
    employeeId: EntityId,
  ): Promise<SalaryStructure | null> {
    const row = await this.repository.findOne({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue(), isActive: true },
    });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: SalaryStructure): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      basicSalary: entity.basicSalary.amount,
      currency: entity.basicSalary.currency.value,
      allowances: toAllowanceLineJson(entity.allowances),
      effectiveFrom: entity.effectiveFrom.toISOString().slice(0, 10),
      isActive: entity.isActive,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: SalaryStructureOrmEntity): SalaryStructure {
    const currency = CurrencyCode.create(row.currency).getValue();
    return SalaryStructure.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      basicSalary: toMoney(row.basicSalary, currency),
      allowances: toAllowanceLines(row.allowances, currency),
      effectiveFrom: new Date(row.effectiveFrom),
      isActive: row.isActive,
    });
  }
}
