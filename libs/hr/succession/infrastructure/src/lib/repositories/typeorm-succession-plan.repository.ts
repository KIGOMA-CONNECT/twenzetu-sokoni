import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { ISuccessionPlanRepository, SuccessionPlan, SuccessionPlanStatus } from '@abms/hr-succession-domain';
import { EntityManager } from 'typeorm';
import { SuccessionPlanOrmEntity } from '../entities/succession-plan-orm.entity';

export class TypeOrmSuccessionPlanRepository
  extends TypeOrmRepository<SuccessionPlan, SuccessionPlanOrmEntity, EntityId>
  implements ISuccessionPlanRepository
{
  public constructor(manager: EntityManager) {
    super(manager, SuccessionPlanOrmEntity);
  }

  public async findById(id: EntityId): Promise<SuccessionPlan | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findOpenByPosition(tenantId: TenantId, positionId: EntityId): Promise<SuccessionPlan | null> {
    const row = await this.repository.findOne({
      where: { tenantId: tenantId.value, positionId: positionId.toValue(), status: 'OPEN' },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<SuccessionPlan[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: SuccessionPlan): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      positionId: entity.positionId.toValue(),
      notes: entity.notes,
      status: entity.status,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: SuccessionPlanOrmEntity): SuccessionPlan {
    return SuccessionPlan.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      positionId: EntityId.create(row.positionId),
      notes: row.notes,
      status: row.status as SuccessionPlanStatus,
    });
  }
}
