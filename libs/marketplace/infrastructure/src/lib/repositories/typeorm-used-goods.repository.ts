import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UsedGoods, IUsedGoodsRepository, UsedGoodsStatus, UsedGoodsCondition } from '@afri-market/marketplace-domain';
import { UsedGoodsOrmEntity } from '../entities/used-goods-orm.entity';

@Injectable()
export class TypeOrmUsedGoodsRepository extends TypeOrmRepository<UsedGoods, UsedGoodsOrmEntity, EntityId> implements IUsedGoodsRepository {
  constructor(manager: EntityManager) {
    super(manager, UsedGoodsOrmEntity);
  }

  public async findById(id: EntityId): Promise<UsedGoods | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findBySellerId(sellerId: string): Promise<UsedGoods[]> {
    const entities = await this.repository.find({ where: { sellerId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async search(
    tenantId: string,
    opts: { search?: string; category?: string; status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: UsedGoods[]; total: number }> {
    const qb = this.repository.createQueryBuilder('ug')
      .where('ug.tenant_id = :tenantId', { tenantId });

    if (opts.search) {
      qb.andWhere('(ug.title ILIKE :search OR ug.description ILIKE :search)', { search: `%${opts.search}%` });
    }
    if (opts.category) {
      qb.andWhere('ug.category = :category', { category: opts.category });
    }
    if (opts.status) {
      qb.andWhere('ug.status = :status', { status: opts.status });
    }

    qb.orderBy('ug.created_at', 'DESC')
      .take(opts.limit ?? 50)
      .skip(opts.offset ?? 0);

    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async save(entity: UsedGoods): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as UsedGoodsOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: UsedGoodsOrmEntity): UsedGoods {
    return UsedGoods.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      sellerId: EntityId.from(e.sellerId),
      sellerName: e.sellerName,
      sellerPhone: e.sellerPhone,
      title: e.title,
      description: e.description ?? undefined,
      category: e.category,
      askingPrice: Money.create(Number(e.askingPrice), e.currency),
      status: e.status as UsedGoodsStatus,
      photoUrls: e.photoUrls ?? undefined,
      location: e.location,
      latitude: e.latitude ?? undefined,
      longitude: e.longitude ?? undefined,
      condition: e.condition as UsedGoodsCondition,
      views: e.views,
      escrowId: e.escrowId ?? undefined,
      version: 1,
    });
  }

  private toOrm(entity: UsedGoods): Partial<UsedGoodsOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      sellerId: entity.sellerId.value,
      sellerName: entity.sellerName,
      sellerPhone: entity.sellerPhone,
      title: entity.title,
      description: entity.description ?? null,
      category: entity.category,
      askingPrice: entity.askingPrice.amount,
      currency: entity.askingPrice.currency,
      status: entity.status,
      photoUrls: entity.photoUrls ?? null,
      location: entity.location,
      latitude: entity.latitude ?? null,
      longitude: entity.longitude ?? null,
      condition: entity.condition,
      views: entity.views,
      escrowId: entity.escrowId ?? null,
    };
  }
}
