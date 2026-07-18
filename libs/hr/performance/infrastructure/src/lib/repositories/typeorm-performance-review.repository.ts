import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  IPerformanceReviewRepository,
  PerformanceReview,
  PerformanceReviewStatus,
} from '@abms/hr-performance-domain';
import { EntityManager } from 'typeorm';
import { PerformanceReviewOrmEntity } from '../entities/performance-review-orm.entity';

export class TypeOrmPerformanceReviewRepository
  extends TypeOrmRepository<PerformanceReview, PerformanceReviewOrmEntity, EntityId>
  implements IPerformanceReviewRepository
{
  public constructor(manager: EntityManager) {
    super(manager, PerformanceReviewOrmEntity);
  }

  public async findById(id: EntityId): Promise<PerformanceReview | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmployeeAndCycle(
    tenantId: TenantId,
    employeeId: EntityId,
    reviewCycleId: EntityId,
  ): Promise<PerformanceReview | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        employeeId: employeeId.toValue(),
        reviewCycleId: reviewCycleId.toValue(),
      },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<PerformanceReview[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async findAllByCycle(tenantId: TenantId, reviewCycleId: EntityId): Promise<PerformanceReview[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, reviewCycleId: reviewCycleId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: PerformanceReview): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      reviewCycleId: entity.reviewCycleId.toValue(),
      reviewerUserId: entity.reviewerUserId,
      rating: entity.rating,
      comments: entity.comments,
      status: entity.status,
      submittedAt: entity.submittedAt,
      acknowledgedAt: entity.acknowledgedAt,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: PerformanceReviewOrmEntity): PerformanceReview {
    return PerformanceReview.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      reviewCycleId: EntityId.create(row.reviewCycleId),
      reviewerUserId: row.reviewerUserId,
      rating: row.rating,
      comments: row.comments,
      status: row.status as PerformanceReviewStatus,
      submittedAt: row.submittedAt,
      acknowledgedAt: row.acknowledgedAt,
    });
  }
}
