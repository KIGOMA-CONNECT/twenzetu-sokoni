import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'reviews' })
@Index(['customerId'])
@Index(['vendorId'])
@Index(['orderId'], { unique: true })
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
