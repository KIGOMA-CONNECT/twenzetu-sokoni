import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { ILeaveTypeRepository, LeaveType } from '@abms/hr-leave-attendance-domain';
import { EntityManager } from 'typeorm';
import { LeaveTypeOrmEntity } from '../entities/leave-type-orm.entity';

export class TypeOrmLeaveTypeRepository
  extends TypeOrmRepository<LeaveType, LeaveTypeOrmEntity, EntityId>
  implements ILeaveTypeRepository
{
  public constructor(manager: EntityManager) {
    super(manager, LeaveTypeOrmEntity);
  }

  public async findById(id: EntityId): Promise<LeaveType | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByCode(tenantId: TenantId, code: string): Promise<LeaveType | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, code } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<LeaveType[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: LeaveType): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      code: entity.code,
      name: entity.name,
      defaultDaysPerYear: entity.defaultDaysPerYear.toString(),
      requiresApproval: entity.requiresApproval,
      isActive: entity.isActive,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: LeaveTypeOrmEntity): LeaveType {
    return LeaveType.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      code: row.code,
      name: row.name,
      defaultDaysPerYear: Number(row.defaultDaysPerYear),
      requiresApproval: row.requiresApproval,
      isActive: row.isActive,
    });
  }
}
