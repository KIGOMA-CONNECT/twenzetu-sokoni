import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'marketing_campaigns' })
@Index(['tenantId', 'createdAt'])
@Index(['status', 'scheduledAt'])
export class MarketingCampaignOrmEntity extends TenantAwareEntity {
  @Column({ name: 'name', type: 'varchar', length: 160 })
  public name!: string;

  @Column({ name: 'message', type: 'text' })
  public message!: string;

  @Column({ name: 'channel', type: 'varchar', length: 20, default: 'sms' })
  public channel!: string;

  @Column({ name: 'audience_type', type: 'varchar', length: 40, default: 'all_customers' })
  public audienceType!: string;

  @Column({ name: 'segment', type: 'jsonb', nullable: true })
  public segment!: Record<string, unknown> | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'DRAFT' })
  public status!: string;

  @Column({ name: 'sent_count', type: 'integer', default: 0 })
  public sentCount!: number;

  @Column({ name: 'failed_count', type: 'integer', default: 0 })
  public failedCount!: number;

  @Column({ name: 'delivered_count', type: 'integer', default: 0 })
  public deliveredCount!: number;

  @Column({ name: 'click_count', type: 'integer', default: 0 })
  public clickCount!: number;

  @Column({ name: 'conversion_count', type: 'integer', default: 0 })
  public conversionCount!: number;

  @Column({ name: 'test_enabled', type: 'boolean', default: false })
  public testEnabled!: boolean;

  @Column({ name: 'variants', type: 'jsonb', nullable: true })
  public variants!: Array<Record<string, unknown>> | null;

  @Column({ name: 'total_audience', type: 'integer', default: 0 })
  public totalAudience!: number;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  public scheduledAt!: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  public startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  public completedAt!: Date | null;
}