import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'disputes' })
@Index(['orderId'])
@Index(['customerId'])
@Index(['status'])
@Index(['tenantId', 'status'])
export class DisputeOrmEntity extends TenantAwareEntity {
  @Column({ name: 'order_id', type: 'uuid' }) public orderId!: string;
  @Column({ name: 'customer_id', type: 'uuid' }) public customerId!: string;
  @Column({ name: 'vendor_id', type: 'uuid' }) public vendorId!: string;
  @Column({ type: 'varchar', length: 30 }) public reason!: string;
  @Column({ type: 'text' }) public description!: string;
  @Column({ name: 'claim_amount', type: 'decimal', precision: 12, scale: 2 }) public claimAmount!: number;
  @Column({ type: 'varchar', length: 10, default: 'TZS' }) public currency!: string;
  @Column({ type: 'varchar', length: 30, default: 'OPEN' }) public status!: string;
  @Column({ type: 'varchar', length: 10 }) public severity!: string;
  @Column({ name: 'fraud_score', type: 'decimal', precision: 5, scale: 2, nullable: true }) public fraudScore!: number | null;
  @Column({ name: 'assigned_agent_id', type: 'uuid', nullable: true }) public assignedAgentId!: string | null;
  @Column({ name: 'resolution_type', type: 'varchar', length: 30, nullable: true }) public resolutionType!: string | null;
  @Column({ name: 'resolved_amount', type: 'decimal', precision: 12, scale: 2, nullable: true }) public resolvedAmount!: number | null;
  @Column({ name: 'resolution_notes', type: 'text', nullable: true }) public resolutionNotes!: string | null;
  @Column({ name: 'pickup_photo_url', type: 'text', nullable: true }) public pickupPhotoUrl!: string | null;
  @Column({ name: 'delivery_photo_url', type: 'text', nullable: true }) public deliveryPhotoUrl!: string | null;
  @Column({ name: 'dispute_photo_url', type: 'text', nullable: true }) public disputePhotoUrl!: string | null;
  @Column({ name: 'geolocation_lat', type: 'decimal', precision: 10, scale: 7, nullable: true }) public geolocationLat!: number | null;
  @Column({ name: 'geolocation_lng', type: 'decimal', precision: 10, scale: 7, nullable: true }) public geolocationLng!: number | null;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
