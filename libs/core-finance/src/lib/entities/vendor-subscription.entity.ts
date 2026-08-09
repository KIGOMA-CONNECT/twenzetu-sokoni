import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VendorSubscriptionTierEntity } from './vendor-subscription-tier.entity';

@Entity('vendor_subscriptions')
export class VendorSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @Column({ name: 'tier_id', type: 'uuid' })
  tierId!: string;

  @ManyToOne(() => VendorSubscriptionTierEntity)
  @JoinColumn({ name: 'tier_id' })
  tier?: VendorSubscriptionTierEntity;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ name: 'current_period_start', type: 'timestamptz' })
  currentPeriodStart!: Date;

  @Column({ name: 'current_period_end', type: 'timestamptz' })
  currentPeriodEnd!: Date;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: 'trial_end', type: 'timestamptz', nullable: true })
  trialEnd?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
