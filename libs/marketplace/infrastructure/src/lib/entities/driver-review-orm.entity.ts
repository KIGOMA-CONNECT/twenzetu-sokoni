import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'driver_reviews' })
@Index(['driverId'])
@Index(['customerId'])
@Index(['deliveryId'], { unique: true })
@Index(['tenantId', 'driverId'])
export class DriverReviewOrmEntity extends TenantAwareEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  public orderId!: string;

  @Column({ name: 'delivery_id', type: 'uuid' })
  public deliveryId!: string;

  @Column({ name: 'driver_id', type: 'uuid' })
  public driverId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  public customerId!: string;

  @Column({ type: 'integer' })
  public rating!: number;

  @Column({ type: 'text', nullable: true })
  public comment!: string | null;
}
