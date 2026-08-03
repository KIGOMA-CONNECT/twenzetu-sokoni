import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { IPositionRepository, Position } from '@abms/hr-domain';
import { EntityManager } from 'typeorm';
import { PositionOrmEntity } from '../entities/position-orm.entity';

export class TypeOrmPositionRepository
  extends TypeOrmRepository<Position, PositionOrmEntity, EntityId>
  implements IPositionRepository
{
  public constructor(manager: EntityManager) {
    super(manager, PositionOrmEntity);
  }

  public async findById(id: EntityId): Promise<Position | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByCode(tenantId: TenantId, code: string): Promise<Position | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, code } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<Position[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: Position): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      code: entity.code,
      title: entity.title,
      description: entity.description,
      isActive: entity.isActive,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: PositionOrmEntity): Position {
    return Position.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      code: row.code,
      title: row.title,
      description: row.description,
      isActive: row.isActive,
    });
  }
}
