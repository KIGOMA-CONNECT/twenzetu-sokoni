import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Advert, IAdvertRepository } from '@afri-market/marketplace-domain';
import { AdvertOrmEntity } from '../entities/advert-orm.entity';

@Injectable()
export class TypeOrmAdvertRepository extends TypeOrmRepository<Advert, AdvertOrmEntity, EntityId> implements IAdvertRepository {
  constructor(manager: EntityManager) {
    super(manager, AdvertOrmEntity);
  }

  public async findById(id: EntityId): Promise<Advert | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findActive(tenantId: string): Promise<Advert[]> {
    const now = new Date();
    const qb = this.repository
      .createQueryBuilder('a')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.is_active = true')
      .andWhere('(a.starts_at IS NULL OR a.starts_at <= :now)', { now })
      .andWhere('(a.ends_at IS NULL OR a.ends_at >= :now)', { now })
      .orderBy('a.sort_order', 'ASC')
      .addOrderBy('a.created_at', 'DESC');
    const entities = await qb.getMany();
    return entities.map((e) => this.toDomain(e));
  }

  public async findByTenant(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<{ data: Advert[]; total: number }> {
    const qb = this.repository.createQueryBuilder('a').where('a.tenant_id = :tenantId', { tenantId });
    qb.orderBy('a.sort_order', 'ASC').take(opts?.limit ?? 50).skip(opts?.offset ?? 0);
    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async save(entity: Advert): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) await this.repository.save({ ...existing, ...orm });
    else await this.repository.save(orm as AdvertOrmEntity);
  }

  public async delete(id: EntityId): Promise<void> { await this.repository.delete(id.value); }
  public async exists(id: EntityId): Promise<boolean> { return (await this.repository.count({ where: { id: id.value } })) > 0; }

  private toDomain(e: AdvertOrmEntity): Advert {
    return Advert.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      title: e.title,
      body: e.body ?? undefined,
      emoji: e.emoji ?? undefined,
      imageUrl: e.imageUrl ?? undefined,
      ctaLabel: e.ctaLabel ?? undefined,
      ctaUrl: e.ctaUrl ?? undefined,
      isActive: e.isActive,
      sortOrder: e.sortOrder,
      startsAt: e.startsAt ?? undefined,
      endsAt: e.endsAt ?? undefined,
    });
  }

  private toOrm(entity: Advert): Partial<AdvertOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      title: entity.title,
      body: entity.body ?? null,
      emoji: entity.emoji ?? null,
      imageUrl: entity.imageUrl ?? null,
      ctaLabel: entity.ctaLabel ?? null,
      ctaUrl: entity.ctaUrl ?? null,
      isActive: entity.isActive,
      sortOrder: entity.sortOrder,
      startsAt: entity.startsAt ?? null,
      endsAt: entity.endsAt ?? null,
    };
  }
}
