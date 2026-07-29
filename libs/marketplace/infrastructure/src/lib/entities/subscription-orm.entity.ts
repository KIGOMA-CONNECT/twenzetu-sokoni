import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'subscriptions' })
@Index(['userId'])
@Index(['vendorId'])
@Index(['status'])
@Index(['nextOrderDate'])
export class SubscriptionOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  public userId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  public productId!: string;

  @Column({ type: 'integer', default: 1 })
  public quantity!: number;

  @Column({ type: 'varchar', length: 20, default: 'weekly' })
  public frequency!: string;

  @Column({ name: 'day_of_week', type: 'integer', nullable: true })
  public dayOfWeek!: number | null;

  @Column({ name: 'day_of_month', type: 'integer', nullable: true })
  public dayOfMonth!: number | null;

  @Column({ name: 'next_order_date', type: 'date' })
  public nextOrderDate!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  public status!: string;

  @Column({ name: 'delivery_address_id', type: 'uuid', nullable: true })
  public deliveryAddressId!: string | null;

  @Column({ type: 'text', nullable: true })
  public notes!: string | null;
}
