import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'sms_credits' })
@Index(['tenantId', 'vendorId'])
export class SmsCreditsOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'total_credits', type: 'integer', default: 0 })
  public totalCredits!: number;

  @Column({ name: 'used_credits', type: 'integer', default: 0 })
  public usedCredits!: number;

  @Column({ name: 'available_credits', type: 'integer', default: 0 })
  public availableCredits!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  public totalSpent!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;
}
