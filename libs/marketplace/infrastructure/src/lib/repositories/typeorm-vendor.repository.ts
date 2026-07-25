import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Vendor, IVendorRepository, VendorCountFilters, VendorStatus } from '@afri-market/marketplace-domain';
import { VendorOrmEntity } from '../entities/vendor-orm.entity';

@Injectable()
export class TypeOrmVendorRepository extends TypeOrmRepository<Vendor, VendorOrmEntity, EntityId> implements IVendorRepository {
  constructor(manager: EntityManager) {
    super(manager, VendorOrmEntity);
  }

  public async findById(id: EntityId): Promise<Vendor | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByUserId(userId: string): Promise<Vendor | null> {
    const entity = await this.repository.findOne({ where: { userId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByCategory(category: string): Promise<Vendor[]> {
    const entities = await this.repository.find({ where: { category, status: 'ACTIVE' } });
    return entities.map((e: VendorOrmEntity) => this.toDomain(e));
  }

  public async findActiveByTenant(tenantId: string): Promise<Vendor[]> {
    const entities = await this.repository.find({ where: { tenantId, status: 'ACTIVE' } });
    return entities.map((e: VendorOrmEntity) => this.toDomain(e));
  }

  public async search(
    tenantId: string,
    opts: { search?: string; category?: string; minRating?: number; limit?: number; offset?: number } = {},
  ): Promise<{ data: Vendor[]; total: number }> {
    const qb = this.repository.createQueryBuilder('v')
      .where('v.tenant_id = :tenantId', { tenantId })
      .andWhere('v.status = :status', { status: 'ACTIVE' });

    if (opts.search) {
      qb.andWhere('(v.shop_name ILIKE :search OR v.description ILIKE :search)', { search: `%${opts.search}%` });
    }
    if (opts.category) {
      qb.andWhere('v.category = :category', { category: opts.category });
    }
    if (opts.minRating !== undefined) {
      qb.andWhere('v.average_rating >= :minRating', { minRating: opts.minRating });
    }

    qb.orderBy('v.average_rating', 'DESC')
      .take(opts.limit ?? 50)
      .skip(opts.offset ?? 0);

    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async countByTenant(tenantId: string, filters?: VendorCountFilters): Promise<number> {
    const where: FindOptionsWhere<VendorOrmEntity> = { tenantId };
    if (filters?.status) where.status = filters.status;
    return this.repository.count({ where });
  }

  public async searchAdmin(
    tenantId: string,
    opts: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: Vendor[]; total: number }> {
    const qb = this.repository.createQueryBuilder('v')
      .where('v.tenant_id = :tenantId', { tenantId });
    if (opts.status) {
      qb.andWhere('v.status = :status', { status: opts.status });
    }
    qb.orderBy('v.created_at', 'ASC')
      .take(opts.limit ?? 50)
      .skip(opts.offset ?? 0);
    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map(e => this.toDomain(e)), total };
  }

  public async save(entity: Vendor): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as VendorOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: VendorOrmEntity): Vendor {
    return Vendor.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      userId: EntityId.from(e.userId),
      shopName: e.shopName,
      description: e.description ?? undefined,
      category: e.category,
      commissionRate: Number(e.commissionRate),
      status: e.status as VendorStatus,
      averageRating: Number(e.averageRating),
      totalOrders: e.totalOrders,
      version: e.version,
    });
  }

  private toOrm(entity: Vendor): Partial<VendorOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      userId: entity.userId.value,
      shopName: entity.shopName,
      description: entity.description ?? null,
      category: entity.category,
      commissionRate: entity.commissionRate,
      status: entity.status,
      averageRating: entity.averageRating,
      totalOrders: entity.totalOrders,
      version: entity.version,
    };
  }
}
