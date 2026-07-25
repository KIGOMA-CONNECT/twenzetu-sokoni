import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'deliveries' })
@Index(['order_id'])
@Index(['driver_id'])
@Index(['status'])
@Index(['tenantId', 'driver_id'])
@Index(['tenantId', 'status'])
export class DeliveryOrmEntity extends TenantAwareEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  public orderId!: string;

  @Column({ name: 'driver_id', type: 'uuid' })
  public driverId!: string;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 20 })
  public vehicleType!: string;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  public status!: string;

  @Column({ name: 'pickup_address', type: 'text' })
  public pickupAddress!: string;

  @Column({ name: 'delivery_address', type: 'text' })
  public deliveryAddress!: string;

  @Column({ name: 'pickup_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public pickupLatitude!: number | null;

  @Column({ name: 'pickup_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public pickupLongitude!: number | null;

  @Column({ name: 'delivery_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public deliveryLatitude!: number | null;

  @Column({ name: 'delivery_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public deliveryLongitude!: number | null;

  @Column({ name: 'distance_km', type: 'decimal', precision: 8, scale: 2, nullable: true })
  public distanceKm!: number | null;

  @Column({ name: 'estimated_time_minutes', type: 'integer', nullable: true })
  public estimatedTimeMinutes!: number | null;

  @Column({ name: 'driver_earnings', type: 'decimal', precision: 12, scale: 2, default: 0 })
  public driverEarnings!: number;

  @Column({ type: 'varchar', length: 10, default: 'TZS' })
  public currency!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
