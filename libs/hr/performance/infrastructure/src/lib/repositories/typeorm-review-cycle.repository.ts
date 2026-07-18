import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { IReviewCycleRepository, ReviewCycle, ReviewCycleStatus } from '@abms/hr-performance-domain';
import { EntityManager } from 'typeorm';
import { ReviewCycleOrmEntity } from '../entities/review-cycle-orm.entity';

export class TypeOrmReviewCycleRepository
  extends TypeOrmRepository<ReviewCycle, ReviewCycleOrmEntity, EntityId>
  implements IReviewCycleRepository
{
  public constructor(manager: EntityManager) {
    super(manager, ReviewCycleOrmEntity);
  }

  public async findById(id: EntityId): Promise<ReviewCycle | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<ReviewCycle[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: ReviewCycle): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      name: entity.name,
      startDate: entity.startDate.toISOString().slice(0, 10),
      endDate: entity.endDate.toISOString().slice(0, 10),
      status: entity.status,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: ReviewCycleOrmEntity): ReviewCycle {
    return ReviewCycle.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      name: row.name,
      startDate: new Date(row.startDate),
      endDate: new Date(row.endDate),
      status: row.status as ReviewCycleStatus,
    });
  }
}
