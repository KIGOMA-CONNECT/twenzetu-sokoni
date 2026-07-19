import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { IOffboardingTaskRepository, OffboardingTask } from '@abms/hr-offboarding-domain';
import { EntityManager } from 'typeorm';
import { OffboardingTaskOrmEntity } from '../entities/offboarding-task-orm.entity';

export class TypeOrmOffboardingTaskRepository
  extends TypeOrmRepository<OffboardingTask, OffboardingTaskOrmEntity, EntityId>
  implements IOffboardingTaskRepository
{
  public constructor(manager: EntityManager) {
    super(manager, OffboardingTaskOrmEntity);
  }

  public async findById(id: EntityId): Promise<OffboardingTask | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByCase(tenantId: TenantId, offboardingCaseId: EntityId): Promise<OffboardingTask[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, offboardingCaseId: offboardingCaseId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: OffboardingTask): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      offboardingCaseId: entity.offboardingCaseId.toValue(),
      employeeId: entity.employeeId.toValue(),
      name: entity.name,
      isCompleted: entity.isCompleted,
      completedAt: entity.completedAt,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: OffboardingTaskOrmEntity): OffboardingTask {
    return OffboardingTask.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      offboardingCaseId: EntityId.create(row.offboardingCaseId),
      employeeId: EntityId.create(row.employeeId),
      name: row.name,
      isCompleted: row.isCompleted,
      completedAt: row.completedAt,
    });
  }
}
