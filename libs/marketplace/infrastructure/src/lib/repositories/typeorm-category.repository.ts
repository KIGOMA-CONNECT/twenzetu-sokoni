import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ProductCategory, IProductCategoryRepository } from '@afri-market/marketplace-domain';
import { CategoryOrmEntity } from '../entities/category-orm.entity';

@Injectable()
export class TypeOrmCategoryRepository extends TypeOrmRepository<ProductCategory, CategoryOrmEntity, EntityId> implements IProductCategoryRepository {
  constructor(manager: EntityManager) {
    super(manager, CategoryOrmEntity);
  }

  public async findById(id: EntityId): Promise<ProductCategory | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByTenant(tenantId: string): Promise<ProductCategory[]> {
    const entities = await this.repository.find({ where: { tenantId } });
    return entities.map((e: CategoryOrmEntity) => this.toDomain(e));
  }

  public async findActive(tenantId: string): Promise<ProductCategory[]> {
    const entities = await this.repository.find({ where: { tenantId, isActive: true } });
    return entities.map((e: CategoryOrmEntity) => this.toDomain(e));
  }

  public async save(entity: ProductCategory): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as CategoryOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: CategoryOrmEntity): ProductCategory {
    return ProductCategory.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      name: e.name,
      type: e.type,
      parentId: e.parentId ? EntityId.from(e.parentId) : undefined,
      imageUrl: e.imageUrl ?? undefined,
      isActive: e.isActive,
      tagline: e.tagline ?? undefined,
      benefits: e.benefits ?? [],
      emoji: e.emoji ?? undefined,
    });
  }

  private toOrm(entity: ProductCategory): Partial<CategoryOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      name: entity.name,
      type: entity.type,
      parentId: entity.parentId?.value ?? null,
      imageUrl: entity.imageUrl ?? null,
      isActive: entity.isActive,
      tagline: entity.tagline ?? null,
      benefits: entity.benefits,
      emoji: entity.emoji ?? null,
    };
  }
}
