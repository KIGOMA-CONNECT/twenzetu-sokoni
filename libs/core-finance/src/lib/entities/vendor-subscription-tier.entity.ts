import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('vendor_subscription_tiers')
export class VendorSubscriptionTierEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'monthly_price', type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice!: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'TZS' })
  currency!: string;

  @Column({ name: 'max_products', type: 'integer', default: 50 })
  maxProducts!: number;

  @Column({ name: 'max_images_per_product', type: 'integer', default: 5 })
  maxImagesPerProduct!: number;

  @Column({ name: 'commission_rate_override', type: 'decimal', precision: 5, scale: 4, nullable: true })
  commissionRateOverride?: number;

  @Column({ name: 'features', type: 'jsonb', default: '[]' })
  features!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
