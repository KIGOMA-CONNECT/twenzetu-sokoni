import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Product, IProductRepository, ProductType, ProductStatus } from '@afri-market/marketplace-domain';
import { ProductOrmEntity } from '../entities/product-orm.entity';

@Injectable()
export class TypeOrmProductRepository extends TypeOrmRepository<Product, ProductOrmEntity, EntityId> implements IProductRepository {
  constructor(manager: EntityManager) {
    super(manager, ProductOrmEntity);
  }

  public async findById(id: EntityId): Promise<Product | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByVendorId(vendorId: string): Promise<Product[]> {
    const entities = await this.repository.find({ where: { vendorId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findByType(type: string): Promise<Product[]> {
    const entities = await this.repository.find({ where: { type } });
    return entities.map((e) => this.toDomain(e));
  }

  public async search(query: string): Promise<Product[]> {
    const entities = await this.repository
      .createQueryBuilder('p')
      .where('LOWER(p.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(p.description) LIKE LOWER(:query)', { query: `%${query}%` })
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  public async findActiveByTenant(tenantId: string): Promise<Product[]> {
    const entities = await this.repository.find({ where: { tenantId, status: 'ACTIVE' } });
    return entities.map((e) => this.toDomain(e));
  }

  public async searchWithFilters(
    tenantId: string,
    opts: { search?: string; categoryId?: string; minPrice?: number; maxPrice?: number; limit?: number; offset?: number } = {},
  ): Promise<{ data: Product[]; total: number }> {
    const qb = this.repository.createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.status = :status', { status: 'ACTIVE' });

    if (opts.search) {
      qb.andWhere('(p.name ILIKE :search OR p.description ILIKE :search)', { search: `%${opts.search}%` });
    }
    if (opts.categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId: opts.categoryId });
    }
    if (opts.minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice: opts.minPrice });
    }
    if (opts.maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: opts.maxPrice });
    }

    qb.orderBy('p.name', 'ASC')
      .take(opts.limit ?? 50)
      .skip(opts.offset ?? 0);

    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async save(entity: Product): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as ProductOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: ProductOrmEntity): Product {
    return Product.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      vendorId: EntityId.from(e.vendorId),
      name: e.name,
      description: e.description,
      price: Money.create(Number(e.price), e.currency),
      type: e.type as ProductType,
      categoryId: EntityId.from(e.categoryId),
      imageUrl: e.imageUrl ?? undefined,
      stockQuantity: e.stockQuantity,
      unit: e.unit,
      status: e.status as ProductStatus,
      version: e.version,
    });
  }

  private toOrm(entity: Product): Partial<ProductOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      vendorId: entity.vendorId.value,
      name: entity.name,
      description: entity.description,
      price: entity.price.amount,
      currency: entity.price.currency,
      type: entity.type,
      categoryId: entity.categoryId.value,
      imageUrl: entity.imageUrl ?? null,
      stockQuantity: entity.stockQuantity,
      unit: entity.unit,
      status: entity.status,
      version: entity.version,
    };
  }
}
