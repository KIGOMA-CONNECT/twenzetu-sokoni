import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { IOnboardingTaskRepository, OnboardingTask } from '@abms/hr-recruitment-domain';
import { EntityManager } from 'typeorm';
import { OnboardingTaskOrmEntity } from '../entities/onboarding-task-orm.entity';

export class TypeOrmOnboardingTaskRepository
  extends TypeOrmRepository<OnboardingTask, OnboardingTaskOrmEntity, EntityId>
  implements IOnboardingTaskRepository
{
  public constructor(manager: EntityManager) {
    super(manager, OnboardingTaskOrmEntity);
  }

  public async findById(id: EntityId): Promise<OnboardingTask | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<OnboardingTask[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: OnboardingTask): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      name: entity.name,
      isCompleted: entity.isCompleted,
      completedAt: entity.completedAt,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: OnboardingTaskOrmEntity): OnboardingTask {
    return OnboardingTask.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      name: row.name,
      isCompleted: row.isCompleted,
      completedAt: row.completedAt,
    });
  }
}
