import { Column, Entity, Index } from 'typeorm';
import { TenantAwareEntity } from '@afri-market/database';

@Entity('pos_shifts')
@Index('IDX_pos_shifts_vendor', ['vendorId'])
@Index('IDX_pos_shifts_tenant_vendor', ['tenantId', 'vendorId'])
@Index('IDX_pos_shifts_tenant_vendor_status', ['tenantId', 'vendorId', 'status'])
export class PosShiftOrmEntity extends TenantAwareEntity {
  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @Column({ name: 'operator_id', type: 'uuid' })
  operatorId!: string;

  @Column({ name: 'shift_number', type: 'varchar', length: 32 })
  shiftNumber!: string;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt!: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ name: 'opening_float', type: 'decimal', precision: 12, scale: 2, default: 0 })
  openingFloat!: number;

  @Column({ name: 'closing_cash', type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingCash!: number | null;

  @Column({ name: 'expected_cash', type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedCash!: number | null;

  @Column({ name: 'cash_variance', type: 'decimal', precision: 12, scale: 2, nullable: true })
  cashVariance!: number | null;

  @Column({ name: 'total_sales', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSales!: number;

  @Column({ name: 'total_refunds', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRefunds!: number;

  @Column({ name: 'sales_count', type: 'integer', default: 0 })
  salesCount!: number;

  @Column({ name: 'payment_breakdown', type: 'jsonb', default: '{}' })
  paymentBreakdown!: Record<string, number>;

  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status!: string;

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'integer', default: 1 })
  version!: number;
}