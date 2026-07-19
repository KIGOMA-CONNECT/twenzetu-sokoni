import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { Course, CourseCategory, ICourseRepository } from '@abms/hr-learning-domain';
import { EntityManager } from 'typeorm';
import { CourseOrmEntity } from '../entities/course-orm.entity';

export class TypeOrmCourseRepository
  extends TypeOrmRepository<Course, CourseOrmEntity, EntityId>
  implements ICourseRepository
{
  public constructor(manager: EntityManager) {
    super(manager, CourseOrmEntity);
  }

  public async findById(id: EntityId): Promise<Course | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<Course[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: Course): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      title: entity.title,
      description: entity.description,
      durationHours: entity.durationHours,
      category: entity.category,
      isActive: entity.isActive,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: CourseOrmEntity): Course {
    return Course.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      title: row.title,
      description: row.description,
      durationHours: row.durationHours,
      category: row.category as CourseCategory,
      isActive: row.isActive,
    });
  }
}
