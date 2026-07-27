import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'deliveries' })
@Index(['orderId'])
@Index(['driverId'])
@Index(['status'])
@Index(['tenantId', 'driverId'])
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

  @Column({ name: 'current_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public currentLatitude!: number | null;

  @Column({ name: 'current_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public currentLongitude!: number | null;

  @Column({ name: 'last_location_update', type: 'timestamptz', nullable: true })
  public lastLocationUpdate!: Date | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
