import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  CampaignListResult,
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

  public async findAudiencePhoneNumbers(tenantId: string, limit = 500): Promise<string[]> {
    const rows: Array<{ phone_number: string }> = await this.repository.manager.query(
      `SELECT DISTINCT phone_number
         FROM users
        WHERE tenant_id = $1
          AND role = 'CUSTOMER'
          AND status = 'ACTIVE'
          AND phone_number IS NOT NULL
          AND phone_number <> ''
        LIMIT $2`,
      [tenantId, limit],
    );
    return rows.map((r) => r.phone_number);
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
      audienceType: 'all_customers',
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