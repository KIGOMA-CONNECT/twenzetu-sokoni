import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VendorSubscriptionTierEntity } from './vendor-subscription-tier.entity';

@Entity('vendor_subscriptions')
export class VendorSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  vendorId!: string;

  @Column({ type: 'uuid' })
  tierId!: string;

  @ManyToOne(() => VendorSubscriptionTierEntity)
  @JoinColumn({ name: 'tier_id' })
  tier?: VendorSubscriptionTierEntity;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ type: 'timestamptz' })
  currentPeriodStart!: Date;

  @Column({ type: 'timestamptz' })
  currentPeriodEnd!: Date;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  trialEnd?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
