import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'order_items' })
@Index(['order_id'])
export class OrderItemOrmEntity extends TenantAwareEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  public orderId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  public productId!: string;

  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  public productName!: string;

  @Column({ type: 'integer' })
  public quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  public unitPrice!: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
  public totalPrice!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;
}
