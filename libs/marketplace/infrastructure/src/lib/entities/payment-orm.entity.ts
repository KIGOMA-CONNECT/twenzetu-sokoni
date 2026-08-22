import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'payments' })
@Index(['orderId'])
@Index(['customerId'])
@Index(['vendorId'])
@Index(['status'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'vendorId'])
export class PaymentOrmEntity extends TenantAwareEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  public orderId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  public customerId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  public amount!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'varchar', length: 20 })
  public method!: string;

  @Column({ type: 'varchar', length: 30, default: 'ESCROW_HELD' })
  public status!: string;

  @Column({ name: 'system_commission', type: 'decimal', precision: 12, scale: 2 })
  public systemCommission!: number;

  @Column({ name: 'vendor_net', type: 'decimal', precision: 12, scale: 2 })
  public vendorNet!: number;

  @Column({ name: 'driver_net', type: 'decimal', precision: 12, scale: 2 })
  public driverNet!: number;

  @Column({ name: 'transaction_ref', type: 'varchar', length: 100, nullable: true })
  public transactionRef!: string | null;

  @Column({ name: 'receipt_number', type: 'varchar', length: 100, nullable: true })
  public receiptNumber!: string | null;

  @Column({ name: 'initiated_at', type: 'timestamptz', nullable: true })
  public initiatedAt!: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  public confirmedAt!: Date | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
