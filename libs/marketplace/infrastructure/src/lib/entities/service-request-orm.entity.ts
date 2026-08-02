import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'service_requests' })
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'vendorId'])
@Index(['status'])
export class ServiceRequestOrmEntity extends TenantAwareEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  public customerId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'listing_id', type: 'uuid', nullable: true })
  public listingId!: string | null;

  @Column({ type: 'varchar', length: 200 })
  public title!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  public quantity!: string;

  @Column({ name: 'unit_label', type: 'varchar', length: 50, default: 'unit' })
  public unitLabel!: string;

  @Column({ type: 'text', default: '' })
  public details!: string;

  @Column({ name: 'photo_urls', type: 'jsonb', default: () => "'[]'" })
  public photoUrls!: string[];

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  public status!: string;

  @Column({ name: 'agreed_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  public agreedPrice!: string | null;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
