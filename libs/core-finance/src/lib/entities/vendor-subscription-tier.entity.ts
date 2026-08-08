import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('vendor_subscription_tiers')
export class VendorSubscriptionTierEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice!: number;

  @Column({ type: 'varchar', length: 3, default: 'TZS' })
  currency!: string;

  @Column({ type: 'integer', default: 50 })
  maxProducts!: number;

  @Column({ type: 'integer', default: 5 })
  maxImagesPerProduct!: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  commissionRateOverride?: number;

  @Column({ type: 'jsonb', default: '[]' })
  features!: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
