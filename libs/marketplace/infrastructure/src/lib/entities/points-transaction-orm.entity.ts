import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'points_transactions' })
@Index(['customerId'])
export class PointsTransactionOrmEntity extends TenantAwareEntity {
  @Column({ name: 'customer_id', type: 'uuid' }) public customerId!: string;
  @Column({ type: 'int' }) public points!: number;
  @Column({ type: 'varchar', length: 20 }) public type!: string;
  @Column({ type: 'text' }) public description!: string;
  @Column({ name: 'order_id', type: 'uuid', nullable: true }) public orderId!: string | null;
}
