import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'credit_scores' })
@Index(['user_id'], { unique: true })
export class CreditScoreOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid' }) public userId!: string;
  @Column({ type: 'int', default: 0 }) public score!: number;
  @Column({ name: 'total_transactions', type: 'int', default: 0 }) public totalTransactions!: number;
  @Column({ name: 'total_revenue', type: 'decimal', precision: 14, scale: 2, default: 0 }) public totalRevenue!: number;
  @Column({ name: 'average_daily_sales', type: 'decimal', precision: 12, scale: 2, default: 0 }) public averageDailySales!: number;
  @Column({ name: 'account_age_days', type: 'int', default: 0 }) public accountAgeDays!: number;
  @Column({ name: 'missed_deliveries', type: 'int', default: 0 }) public missedDeliveries!: number;
  @Column({ name: 'dispute_count', type: 'int', default: 0 }) public disputeCount!: number;
  @Column({ name: 'last_calculated_at', type: 'timestamptz' }) public lastCalculatedAt!: Date;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
