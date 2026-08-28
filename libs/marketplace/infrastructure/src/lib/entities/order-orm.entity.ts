import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'orders' })
@Index(['customerId'])
@Index(['vendorId'])
@Index(['driverId'])
@Index(['status'])
@Index(['createdAt'])
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'customerId'])
export class OrderOrmEntity extends TenantAwareEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  public customerId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  public driverId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  public type!: string;

  @Column({ type: 'varchar', length: 30, default: 'PLACED' })
  public status!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  public subtotal!: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public deliveryFee!: number;

  @Column({ name: 'system_commission', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public systemCommission!: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public totalAmount!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ name: 'delivery_address', type: 'text' })
  public deliveryAddress!: string;

  @Column({ name: 'delivery_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public deliveryLatitude!: number | null;

  @Column({ name: 'delivery_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public deliveryLongitude!: number | null;

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  public specialInstructions!: string | null;

  @Column({ name: 'otp_code', type: 'varchar', length: 10, nullable: true })
  public otpCode!: string | null;

  @Column({ name: 'otp_verified', type: 'boolean', default: false })
  public otpVerified!: boolean;

  @Column({ name: 'otp_attempts', type: 'integer', default: 0 })
  public otpAttempts!: number;

  @Column({ name: 'pickup_code', type: 'varchar', length: 10, nullable: true })
  public pickupCode!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
