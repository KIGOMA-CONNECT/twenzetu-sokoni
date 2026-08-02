import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Coupon, CouponStatus, DiscountType, ICouponRepository } from '@afri-market/marketplace-domain';
import { CouponOrmEntity } from '../entities/coupon-orm.entity';

@Injectable()
export class TypeOrmCouponRepository extends TypeOrmRepository<Coupon, CouponOrmEntity, EntityId> implements ICouponRepository {
  constructor(manager: EntityManager) {
    super(manager, CouponOrmEntity);
  }

  public async findById(id: EntityId): Promise<Coupon | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByCode(code: string, tenantId: string): Promise<Coupon | null> {
    const e = await this.repository.findOne({ where: { code: code.toUpperCase(), tenantId } });
    return e ? this.toDomain(e) : null;
  }

  public async findByTenant(tenantId: string, opts?: { status?: string; limit?: number; offset?: number }): Promise<{ data: Coupon[]; total: number }> {
    const qb = this.repository.createQueryBuilder('c').where('c.tenant_id = :tenantId', { tenantId });
    if (opts?.status) qb.andWhere('c.status = :status', { status: opts.status });
    qb.orderBy('c.created_at', 'DESC').take(opts?.limit ?? 50).skip(opts?.offset ?? 0);
    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map(e => this.toDomain(e)), total };
  }

  public async save(entity: Coupon): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) await this.repository.save({ ...existing, ...orm });
    else await this.repository.save(orm as CouponOrmEntity);
  }

  public async delete(id: EntityId): Promise<void> { await this.repository.delete(id.value); }
  public async exists(id: EntityId): Promise<boolean> { return (await this.repository.count({ where: { id: id.value } })) > 0; }

  private toDomain(e: CouponOrmEntity): Coupon {
    return Coupon.reconstitute({
      id: EntityId.from(e.id), tenantId: TenantId.create(e.tenantId),
      code: e.code, discountType: e.discountType as DiscountType, discountValue: Number(e.discountValue),
      currency: e.currency, status: e.status as CouponStatus, usageCount: e.usageCount,
      minOrderAmount: e.minOrderAmount ?? undefined, maxUsageCount: e.maxUsageCount ?? undefined,
      maxUsagePerUser: e.maxUsagePerUser ?? undefined, expiresAt: e.expiresAt ?? undefined,
      description: e.description ?? undefined, version: e.version,
    });
  }

  private toOrm(entity: Coupon): Partial<CouponOrmEntity> {
    return {
      id: entity.id.value, tenantId: entity.tenantId.value, code: entity.code,
      discountType: entity.discountType, discountValue: entity.discountValue, currency: entity.currency,
      status: entity.status, usageCount: entity.usageCount,
      minOrderAmount: entity.minOrderAmount ?? null, maxUsageCount: entity.maxUsageCount ?? null,
      maxUsagePerUser: entity.maxUsagePerUser ?? null, expiresAt: entity.expiresAt ?? null,
      description: entity.description ?? null, version: entity.version,
    };
  }
}
