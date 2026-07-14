import { TypeOrmRepository } from '@abms/database';
import { EntityId } from '@abms/kernel';
import { ITenantRepository, Tenant, TenantStatus } from '@abms/identity-domain';
import { EntityManager } from 'typeorm';
import { TenantOrmEntity } from '../entities/tenant-orm.entity';

export class TypeOrmTenantRepository
  extends TypeOrmRepository<Tenant, TenantOrmEntity, EntityId>
  implements ITenantRepository
{
  public constructor(manager: EntityManager) {
    super(manager, TenantOrmEntity);
  }

  public async findById(id: EntityId): Promise<Tenant | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: Tenant): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      name: entity.name,
      status: entity.status,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: TenantOrmEntity): Tenant {
    return Tenant.reconstitute({
      id: EntityId.create(row.id),
      name: row.name,
      status: row.status as TenantStatus,
    });
  }
}
