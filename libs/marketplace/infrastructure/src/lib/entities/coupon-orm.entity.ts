import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'coupons' })
@Index(['code', 'tenantId'], { unique: true })
@Index(['status'])
export class CouponOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 50 })
  public code!: string;

  @Column({ name: 'discount_type', type: 'varchar', length: 20 })
  public discountType!: string;

  @Column({ name: 'discount_value', type: 'decimal', precision: 12, scale: 2 })
  public discountValue!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  public status!: string;

  @Column({ name: 'usage_count', type: 'integer', default: 0 })
  public usageCount!: number;

  @Column({ name: 'min_order_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  public minOrderAmount!: number | null;

  @Column({ name: 'max_usage_count', type: 'integer', nullable: true })
  public maxUsageCount!: number | null;

  @Column({ name: 'max_usage_per_user', type: 'integer', nullable: true })
  public maxUsagePerUser!: number | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  public expiresAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
