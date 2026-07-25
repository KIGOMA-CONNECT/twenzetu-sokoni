import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'products' })
@Index(['vendor_id'])
@Index(['type'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'status'])
export class ProductOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'text' })
  public description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  public price!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'varchar', length: 20 })
  public type!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  public categoryId!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  public imageUrl!: string | null;

  @Column({ name: 'stock_quantity', type: 'integer', default: 0 })
  public stockQuantity!: number;

  @Column({ type: 'varchar', length: 20, default: 'piece' })
  public unit!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
