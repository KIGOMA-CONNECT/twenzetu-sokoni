import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'vendors' })
@Index(['userId'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'category'])
export class VendorOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ name: 'shop_name', type: 'varchar', length: 200 })
  public shopName!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'varchar', length: 50 })
  public category!: string;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2 })
  public commissionRate!: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  public status!: string;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 1, default: 0 })
  public averageRating!: number;

  @Column({ name: 'total_orders', type: 'integer', default: 0 })
  public totalOrders!: number;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public latitude!: number | null;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public longitude!: number | null;

  @Column({ type: 'jsonb', default: {} })
  public settings!: Record<string, unknown>;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
