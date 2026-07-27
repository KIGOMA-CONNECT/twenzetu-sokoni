import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'flash_sales' })
@Index(['productId'])
@Index(['status'])
export class FlashSaleOrmEntity extends TenantAwareEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  public productId!: string;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2 })
  public discountPercent!: number;

  @Column({ name: 'original_price', type: 'decimal', precision: 12, scale: 2 })
  public originalPrice!: number;

  @Column({ name: 'sale_price', type: 'decimal', precision: 12, scale: 2 })
  public salePrice!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
  public status!: string;

  @Column({ name: 'total_quantity', type: 'integer' })
  public totalQuantity!: number;

  @Column({ name: 'sold_quantity', type: 'integer', default: 0 })
  public soldQuantity!: number;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  public startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  public endsAt!: Date;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
