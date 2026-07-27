import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'vendor_quotes' })
@Index(['procurementId'])
@Index(['vendorId'])
export class VendorQuoteOrmEntity extends TenantAwareEntity {
  @Column({ name: 'procurement_id', type: 'uuid' })
  public procurementId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  public price!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ name: 'item_condition', type: 'varchar', length: 20 })
  public itemCondition!: string;

  @Column({ name: 'warranty_period_days', type: 'integer', default: 0 })
  public warrantyPeriodDays!: number;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
