import { EntityId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Tenant, ITenantRepository, TenantStatus } from '@afri-market/identity-domain';
import { TenantOrmEntity } from '../entities/tenant-orm.entity';

@Injectable()
export class TypeOrmTenantRepository extends TypeOrmRepository<Tenant, TenantOrmEntity, EntityId> implements ITenantRepository {
  constructor(manager: EntityManager) {
    super(manager, TenantOrmEntity);
  }

  public async findById(id: EntityId): Promise<Tenant | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async save(entity: Tenant): Promise<void> {
    await this.repository.save(this.toOrm(entity));
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(entity: TenantOrmEntity): Tenant {
    return Tenant.reconstitute({
      id: EntityId.from(entity.id),
      name: entity.name,
      status: entity.status as TenantStatus,
    });
  }

  private toOrm(entity: Tenant): Partial<TenantOrmEntity> {
    return {
      id: entity.id.value,
      name: entity.name,
      status: entity.status,
    };
  }
}
