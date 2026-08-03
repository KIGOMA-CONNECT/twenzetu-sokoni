import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { Goal, GoalStatus, IGoalRepository } from '@abms/hr-performance-domain';
import { EntityManager } from 'typeorm';
import { GoalOrmEntity } from '../entities/goal-orm.entity';

export class TypeOrmGoalRepository
  extends TypeOrmRepository<Goal, GoalOrmEntity, EntityId>
  implements IGoalRepository
{
  public constructor(manager: EntityManager) {
    super(manager, GoalOrmEntity);
  }

  public async findById(id: EntityId): Promise<Goal | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<Goal[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: Goal): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      title: entity.title,
      description: entity.description,
      targetDate: entity.targetDate.toISOString().slice(0, 10),
      status: entity.status,
      progressPercent: entity.progressPercent,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: GoalOrmEntity): Goal {
    return Goal.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      title: row.title,
      description: row.description,
      targetDate: new Date(row.targetDate),
      status: row.status as GoalStatus,
      progressPercent: row.progressPercent,
    });
  }
}
