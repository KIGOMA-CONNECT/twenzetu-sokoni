import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'reviews' })
@Index(['customer_id'])
@Index(['vendor_id'])
@Index(['order_id'], { unique: true })
export class ReviewOrmEntity extends TenantAwareEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  public customerId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  public orderId!: string;

  @Column({ type: 'integer' })
  public rating!: number;

  @Column({ type: 'text', nullable: true })
  public comment!: string | null;
}
