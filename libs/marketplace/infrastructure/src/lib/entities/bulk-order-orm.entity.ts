import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'bulk_orders' })
export class BulkOrderOrmEntity extends TenantAwareEntity {
  @Column({ name: 'source_type', type: 'varchar', length: 20 }) public sourceType!: string;
  @Column({ name: 'source_name', type: 'varchar', length: 200 }) public sourceName!: string;
  @Column({ name: 'source_phone', type: 'varchar', length: 15 }) public sourcePhone!: string;
  @Column({ name: 'product_name', type: 'varchar', length: 200 }) public productName!: string;
  @Column({ name: 'total_quantity', type: 'decimal', precision: 10, scale: 2 }) public totalQuantity!: number;
  @Column({ type: 'varchar', length: 20 }) public unit!: string;
  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2 }) public totalAmount!: number;
  @Column({ type: 'varchar', length: 10, default: 'TZS' }) public currency!: string;
  @Column({ name: 'participant_vendor_ids', type: 'jsonb', default: '[]' }) public participantVendorIds!: string[];
  @Column({ type: 'varchar', length: 30, default: 'COLLECTING' }) public status!: string;
  @Column({ name: 'expected_delivery_date', type: 'timestamptz', nullable: true }) public expectedDeliveryDate!: Date | null;
  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true }) public deliveredAt!: Date | null;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
