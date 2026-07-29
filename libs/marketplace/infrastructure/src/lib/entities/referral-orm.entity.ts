import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'referrals' })
@Index(['referrerId'])
@Index(['referralCode'])
@Index(['status'])
export class ReferralOrmEntity extends TenantAwareEntity {
  @Column({ name: 'referrer_id', type: 'uuid' })
  public referrerId!: string;

  @Column({ name: 'referral_code', type: 'varchar', length: 20 })
  public referralCode!: string;

  @Column({ name: 'referred_phone', type: 'varchar', length: 15, nullable: true })
  public referredPhone!: string | null;

  @Column({ name: 'referred_id', type: 'uuid', nullable: true })
  public referredId!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  public status!: string;

  @Column({ name: 'reward_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public rewardAmount!: number;

  @Column({ name: 'reward_claimed', type: 'boolean', default: false })
  public rewardClaimed!: boolean;
}
