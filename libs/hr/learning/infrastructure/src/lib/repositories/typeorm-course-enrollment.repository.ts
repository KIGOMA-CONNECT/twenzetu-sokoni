import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  CourseEnrollment,
  CourseEnrollmentStatus,
  ICourseEnrollmentRepository,
} from '@abms/hr-learning-domain';
import { EntityManager } from 'typeorm';
import { CourseEnrollmentOrmEntity } from '../entities/course-enrollment-orm.entity';

export class TypeOrmCourseEnrollmentRepository
  extends TypeOrmRepository<CourseEnrollment, CourseEnrollmentOrmEntity, EntityId>
  implements ICourseEnrollmentRepository
{
  public constructor(manager: EntityManager) {
    super(manager, CourseEnrollmentOrmEntity);
  }

  public async findById(id: EntityId): Promise<CourseEnrollment | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findActiveByEmployeeAndCourse(
    tenantId: TenantId,
    employeeId: EntityId,
    courseId: EntityId,
  ): Promise<CourseEnrollment | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        employeeId: employeeId.toValue(),
        courseId: courseId.toValue(),
        status: 'IN_PROGRESS',
      },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<CourseEnrollment[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: CourseEnrollment): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      courseId: entity.courseId.toValue(),
      enrolledDate: entity.enrolledDate.toISOString().slice(0, 10),
      status: entity.status,
      score: entity.score,
      completedDate: entity.completedDate ? entity.completedDate.toISOString().slice(0, 10) : null,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: CourseEnrollmentOrmEntity): CourseEnrollment {
    return CourseEnrollment.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      courseId: EntityId.create(row.courseId),
      enrolledDate: new Date(row.enrolledDate),
      status: row.status as CourseEnrollmentStatus,
      score: row.score,
      completedDate: row.completedDate ? new Date(row.completedDate) : null,
    });
  }
}
