import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'service_listings' })
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'category'])
export class ServiceListingOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'text', default: '' })
  public description!: string;

  @Column({ type: 'varchar', length: 50 })
  public category!: string;

  @Column({ name: 'pricing_model', type: 'varchar', length: 20, default: 'per_unit' })
  public pricingModel!: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public basePrice!: string;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ name: 'unit_label', type: 'varchar', length: 50, default: 'unit' })
  public unitLabel!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  public imageUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
