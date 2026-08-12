import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'purchase_orders' })
@Index(['vendorId'])
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'vendorId', 'createdAt'])
export class PurchaseOrderOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  public vendorId!: string;

  @Column({ name: 'operator_id', type: 'uuid' })
  public operatorId!: string;

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  public supplierId!: string | null;

  @Column({ name: 'po_number', type: 'varchar', length: 64 })
  public poNumber!: string;

  @Column({ type: 'jsonb' })
  public items!: unknown[];

  @Column({ name: 'total_cost', type: 'decimal', precision: 12, scale: 2 })
  public totalCost!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'varchar', length: 20, default: 'ORDERED' })
  public status!: string;

  @Column({ name: 'payment_status', type: 'varchar', length: 10, default: 'UNPAID' })
  public paymentStatus!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  public notes!: string | null;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  public receivedAt!: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  public confirmedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  public completedAt!: Date | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}