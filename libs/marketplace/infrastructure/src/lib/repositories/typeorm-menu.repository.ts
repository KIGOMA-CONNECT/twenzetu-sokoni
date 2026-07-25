import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Menu, IMenuRepository } from '@afri-market/marketplace-domain';
import { MenuOrmEntity } from '../entities/menu-orm.entity';

@Injectable()
export class TypeOrmMenuRepository extends TypeOrmRepository<Menu, MenuOrmEntity, EntityId> implements IMenuRepository {
  constructor(manager: EntityManager) {
    super(manager, MenuOrmEntity);
  }

  public async findById(id: EntityId): Promise<Menu | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByVendorId(vendorId: string): Promise<Menu[]> {
    const entities = await this.repository.find({ where: { vendorId } });
    return entities.map((e: MenuOrmEntity) => this.toDomain(e));
  }

  public async findActive(vendorId: string): Promise<Menu[]> {
    const entities = await this.repository.find({ where: { vendorId, isActive: true } });
    return entities.map((e: MenuOrmEntity) => this.toDomain(e));
  }

  public async save(entity: Menu): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as MenuOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: MenuOrmEntity): Menu {
    return Menu.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      vendorId: EntityId.from(e.vendorId),
      name: e.name,
      description: e.description ?? undefined,
      availableFrom: e.availableFrom ?? undefined,
      availableUntil: e.availableUntil ?? undefined,
      isActive: e.isActive,
    });
  }

  private toOrm(entity: Menu): Partial<MenuOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      vendorId: entity.vendorId.value,
      name: entity.name,
      description: entity.description ?? null,
      availableFrom: entity.availableFrom ?? null,
      availableUntil: entity.availableUntil ?? null,
      isActive: entity.isActive,
    };
  }
}
