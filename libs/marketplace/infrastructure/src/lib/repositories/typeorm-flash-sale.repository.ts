import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FlashSale, IFlashSaleRepository } from '@afri-market/marketplace-domain';
import { FlashSaleOrmEntity } from '../entities/flash-sale-orm.entity';

@Injectable()
export class TypeOrmFlashSaleRepository extends TypeOrmRepository<FlashSale, FlashSaleOrmEntity, EntityId> implements IFlashSaleRepository {
  constructor(manager: EntityManager) {
    super(manager, FlashSaleOrmEntity);
  }

  public async findById(id: EntityId): Promise<FlashSale | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByProductId(productId: string): Promise<FlashSale | null> {
    const now = new Date();
    const e = await this.repository.findOne({ where: { productId, status: 'ACTIVE', startsAt: LessThanOrEqual(now), endsAt: MoreThanOrEqual(now) } });
    return e ? this.toDomain(e) : null;
  }

  public async findActive(tenantId: string): Promise<FlashSale[]> {
    const now = new Date();
    const entities = await this.repository.find({ where: { tenantId, status: 'ACTIVE', startsAt: LessThanOrEqual(now), endsAt: MoreThanOrEqual(now) } });
    return entities.map(e => this.toDomain(e));
  }

  public async findByTenant(tenantId: string, opts?: { status?: string; limit?: number; offset?: number }): Promise<{ data: FlashSale[]; total: number }> {
    const qb = this.repository.createQueryBuilder('f').where('f.tenant_id = :tenantId', { tenantId });
    if (opts?.status) qb.andWhere('f.status = :status', { status: opts.status });
    qb.orderBy('f.created_at', 'DESC').take(opts?.limit ?? 50).skip(opts?.offset ?? 0);
    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map(e => this.toDomain(e)), total };
  }

  public async save(entity: FlashSale): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) await this.repository.save({ ...existing, ...orm });
    else await this.repository.save(orm as FlashSaleOrmEntity);
  }

  public async delete(id: EntityId): Promise<void> { await this.repository.delete(id.value); }
  public async exists(id: EntityId): Promise<boolean> { return (await this.repository.count({ where: { id: id.value } })) > 0; }

  private toDomain(e: FlashSaleOrmEntity): FlashSale {
    return FlashSale.reconstitute({
      id: EntityId.from(e.id), tenantId: TenantId.create(e.tenantId),
      productId: EntityId.from(e.productId), discountPercent: Number(e.discountPercent),
      originalPrice: Number(e.originalPrice), salePrice: Number(e.salePrice),
      currency: e.currency, status: e.status as any,
      totalQuantity: e.totalQuantity, soldQuantity: e.soldQuantity,
      startsAt: e.startsAt, endsAt: e.endsAt, description: e.description ?? undefined,
      version: e.version,
    });
  }

  private toOrm(entity: FlashSale): Partial<FlashSaleOrmEntity> {
    return {
      id: entity.id.value, tenantId: entity.tenantId.value,
      productId: entity.productId.value, discountPercent: entity.discountPercent,
      originalPrice: entity.originalPrice, salePrice: entity.salePrice,
      currency: entity.currency, status: entity.status,
      totalQuantity: entity.totalQuantity, soldQuantity: entity.soldQuantity,
      startsAt: entity.startsAt, endsAt: entity.endsAt,
      description: entity.description ?? null, version: entity.version,
    };
  }
}
