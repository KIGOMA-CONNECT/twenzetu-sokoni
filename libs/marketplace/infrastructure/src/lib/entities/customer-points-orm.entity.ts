import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'customer_points' })
@Index(['customer_id'], { unique: true })
export class CustomerPointsOrmEntity extends TenantAwareEntity {
  @Column({ name: 'customer_id', type: 'uuid' }) public customerId!: string;
  @Column({ name: 'total_points', type: 'int', default: 0 }) public totalPoints!: number;
  @Column({ name: 'redeemable_points', type: 'int', default: 0 }) public redeemablePoints!: number;
  @Column({ name: 'lifetime_points', type: 'int', default: 0 }) public lifetimePoints!: number;
  @Column({ type: 'varchar', length: 20, default: 'BRONZE' }) public tier!: string;
  @Column({ name: 'referral_code', type: 'varchar', length: 20, unique: true, nullable: true }) public referralCode!: string | null;
  @Column({ name: 'referred_by', type: 'uuid', nullable: true }) public referredBy!: string | null;
  @Column({ name: 'total_referrals', type: 'int', default: 0 }) public totalReferrals!: number;
  @Column({ name: 'free_deliveries_remaining', type: 'int', default: 0 }) public freeDeliveriesRemaining!: number;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
