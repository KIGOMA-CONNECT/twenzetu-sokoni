import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  CampaignAudienceQuery,
  CampaignListResult,
  CampaignSegment,
  IMarketingCampaignRepository,
  MarketingCampaign,
} from '@afri-market/marketplace-domain';
import { MarketingCampaignOrmEntity } from '../entities/marketing-campaign-orm.entity';

@Injectable()
export class TypeOrmMarketingCampaignRepository extends TypeOrmRepository<MarketingCampaign, MarketingCampaignOrmEntity, EntityId> implements IMarketingCampaignRepository {
  constructor(manager: EntityManager) {
    super(manager, MarketingCampaignOrmEntity);
  }

  public async findById(id: EntityId): Promise<MarketingCampaign | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByIdAndTenant(id: string, tenantId: string): Promise<MarketingCampaign | null> {
    const e = await this.repository.findOne({ where: { id, tenantId } });
    return e ? this.toDomain(e) : null;
  }

  public async findByTenant(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<CampaignListResult> {
    const qb = this.repository.createQueryBuilder('c').where('c.tenant_id = :tenantId', { tenantId });
    qb.orderBy('c.created_at', 'DESC').take(opts?.limit ?? 50).skip(opts?.offset ?? 0);
    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async findAudiencePhoneNumbers(tenantId: string, opts?: CampaignAudienceQuery): Promise<string[]> {
    const limit = opts?.limit ?? 500;
    const segment = opts?.segment;
    const params: unknown[] = [tenantId];
    const filters: string[] = [];
    if (segment?.minOrders && segment.minOrders > 0) {
      params.push(segment.minOrders);
      filters.push(
        `(SELECT COUNT(*) FROM orders o WHERE o.tenant_id = u.tenant_id AND o.customer_id = u.id AND o.status = 'DELIVERED') >= $${params.length}`,
      );
    }
    if (segment?.lastOrderWithinDays && segment.lastOrderWithinDays > 0) {
      params.push(segment.lastOrderWithinDays);
      filters.push(
        `EXISTS (SELECT 1 FROM orders o WHERE o.tenant_id = u.tenant_id AND o.customer_id = u.id AND o.status = 'DELIVERED' AND o.created_at >= NOW() - ($${params.length} * INTERVAL '1 day'))`,
      );
    }
    const filterSql = filters.length ? ` AND ${filters.join(' AND ')}` : '';
    params.push(limit);
    const rows: Array<{ phone_number: string }> = await this.repository.manager.query(
      `SELECT DISTINCT u.phone_number
         FROM users u
        WHERE u.tenant_id = $1
          AND u.role = 'CUSTOMER'
          AND u.status = 'ACTIVE'
          AND u.phone_number IS NOT NULL
          AND u.phone_number <> ''${filterSql}
        ORDER BY u.phone_number
        LIMIT $${params.length}`,
      params,
    );
    return rows.map((r) => r.phone_number);
  }

  public async findDueScheduled(now: Date, opts?: { limit?: number }): Promise<MarketingCampaign[]> {
    const entities = await this.repository
      .createQueryBuilder('c')
      .where('c.status = :status', { status: 'DRAFT' })
      .andWhere('c.scheduled_at IS NOT NULL')
      .andWhere('c.scheduled_at <= :now', { now })
      .orderBy('c.scheduled_at', 'ASC')
      .take(opts?.limit ?? 20)
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  public async save(entity: MarketingCampaign): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) await this.repository.save({ ...existing, ...orm });
    else await this.repository.save(orm as MarketingCampaignOrmEntity);
  }

  public async delete(id: EntityId): Promise<void> { await this.repository.delete(id.value); }
  public async exists(id: EntityId): Promise<boolean> { return (await this.repository.count({ where: { id: id.value } })) > 0; }

  private toDomain(e: MarketingCampaignOrmEntity): MarketingCampaign {
    return MarketingCampaign.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      name: e.name,
      message: e.message,
      channel: e.channel as 'sms' | 'whatsapp',
      status: e.status as MarketingCampaign['status'],
      sentCount: e.sentCount,
      failedCount: e.failedCount,
      totalAudience: e.totalAudience,
      scheduledAt: e.scheduledAt ?? undefined,
      segment: (e.segment as CampaignSegment | null) ?? undefined,
      startedAt: e.startedAt ?? undefined,
      completedAt: e.completedAt ?? undefined,
      version: 1,
    });
  }

  private toOrm(entity: MarketingCampaign): Partial<MarketingCampaignOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      name: entity.name,
      message: entity.message,
      channel: entity.channel,
      audienceType: entity.segment ? 'segmented' : 'all_customers',
      segment: entity.segment ? { ...entity.segment } : null,
      status: entity.status,
      sentCount: entity.sentCount,
      failedCount: entity.failedCount,
      totalAudience: entity.totalAudience,
      scheduledAt: entity.scheduledAt ?? null,
      startedAt: entity.startedAt ?? null,
      completedAt: entity.completedAt ?? null,
    };
  }
}