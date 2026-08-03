import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  IOffboardingCaseRepository,
  OffboardingCase,
  OffboardingCaseStatus,
  OffboardingExitReason,
} from '@abms/hr-offboarding-domain';
import { EntityManager } from 'typeorm';
import { OffboardingCaseOrmEntity } from '../entities/offboarding-case-orm.entity';

export class TypeOrmOffboardingCaseRepository
  extends TypeOrmRepository<OffboardingCase, OffboardingCaseOrmEntity, EntityId>
  implements IOffboardingCaseRepository
{
  public constructor(manager: EntityManager) {
    super(manager, OffboardingCaseOrmEntity);
  }

  public async findById(id: EntityId): Promise<OffboardingCase | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findActiveByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<OffboardingCase | null> {
    const row = await this.repository.findOne({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue(), status: 'INITIATED' },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<OffboardingCase[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: OffboardingCase): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      exitReason: entity.exitReason,
      lastWorkingDay: entity.lastWorkingDay.toISOString().slice(0, 10),
      status: entity.status,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: OffboardingCaseOrmEntity): OffboardingCase {
    return OffboardingCase.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      exitReason: row.exitReason as OffboardingExitReason,
      lastWorkingDay: new Date(row.lastWorkingDay),
      status: row.status as OffboardingCaseStatus,
    });
  }
}
