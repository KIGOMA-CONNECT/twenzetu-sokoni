import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  CampaignAudienceQuery,
  CampaignListResult,
  CampaignRecipientRow,
  CampaignSegment,
  CampaignVariant,
  CampaignVariantStat,
  IMarketingCampaignRepository,
  MarketingCampaign,
} from '@afri-market/marketplace-domain';
import { MarketingCampaignOrmEntity } from '../entities/marketing-campaign-orm.entity';
import { CampaignRecipientOrmEntity } from '../entities/campaign-recipient-orm.entity';

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

  public async saveRecipients(tenantId: string, campaignId: string, rows: CampaignRecipientRow[]): Promise<void> {
    if (rows.length === 0) return;
    const entities = rows.map(
      (r): CampaignRecipientOrmEntity => ({
        id: undefined as unknown as string,
        tenantId,
        campaignId,
        phoneNumber: r.phoneNumber,
        variantIndex: r.variantIndex,
        status: r.status,
        sentAt: new Date(),
        createdAt: new Date(),
      } as CampaignRecipientOrmEntity),
    );
    // Recipients are unique per (campaign, phone); skip rows already tracked so
    // re-running a partially-failed launch does not duplicate history.
    await this.repository.manager
      .createQueryBuilder()
      .insert()
      .into(CampaignRecipientOrmEntity)
      .values(entities)
      .orIgnore()
      .execute();
  }

  public async getRecipientStats(campaignId: string, conversionWindowDays: number): Promise<CampaignVariantStat[]> {
    const rows: Array<{ variant_index: number; sent: string; failed: string; converted: string }> =
      await this.repository.manager.query(
        `SELECT r.variant_index,
                COUNT(*) FILTER (WHERE r.status = 'SENT') AS sent,
                COUNT(*) FILTER (WHERE r.status = 'FAILED') AS failed,
                COUNT(DISTINCT CASE WHEN EXISTS (
                  SELECT 1
                    FROM users u
                    JOIN orders o ON o.tenant_id = u.tenant_id AND o.customer_id = u.id
                   WHERE u.phone_number = r.phone_number
                     AND o.status = 'DELIVERED'
                     AND o.created_at >= r.sent_at
                     AND o.created_at <= r.sent_at + ($2 * INTERVAL '1 day')
                ) THEN r.phone_number END) AS converted
           FROM campaign_recipients r
          WHERE r.campaign_id = $1
          GROUP BY r.variant_index
          ORDER BY r.variant_index`,
        [campaignId, conversionWindowDays],
      );
    return rows.map((r) => ({
      variantIndex: Number(r.variant_index),
      sent: Number(r.sent),
      failed: Number(r.failed),
      converted: Number(r.converted),
    }));
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
      deliveredCount: e.deliveredCount ?? 0,
      clickCount: e.clickCount ?? 0,
      conversionCount: e.conversionCount ?? 0,
      totalAudience: e.totalAudience,
      scheduledAt: e.scheduledAt ?? undefined,
      segment: (e.segment as CampaignSegment | null) ?? undefined,
      testEnabled: e.testEnabled ?? false,
      variants: (e.variants as CampaignVariant[] | null) ?? [],
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
      deliveredCount: entity.deliveredCount,
      clickCount: entity.clickCount,
      conversionCount: entity.conversionCount,
      testEnabled: entity.testEnabled,
      variants: entity.variants.length ? entity.variants.map((v) => ({ ...v })) : null,
      totalAudience: entity.totalAudience,
      scheduledAt: entity.scheduledAt ?? null,
      startedAt: entity.startedAt ?? null,
      completedAt: entity.completedAt ?? null,
    };
  }
}