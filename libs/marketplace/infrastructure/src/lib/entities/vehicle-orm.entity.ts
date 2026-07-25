import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'vehicles' })
@Index(['driver_id'])
@Index(['vehicle_type'])
export class VehicleOrmEntity extends TenantAwareEntity {
  @Column({ name: 'driver_id', type: 'uuid' })
  public driverId!: string;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 20 })
  public vehicleType!: string;

  @Column({ name: 'plate_number', type: 'varchar', length: 20 })
  public plateNumber!: string;

  @Column({ name: 'capacity_kg', type: 'decimal', precision: 8, scale: 2 })
  public capacityKg!: number;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  public isAvailable!: boolean;

  @Column({ name: 'current_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public currentLatitude!: number | null;

  @Column({ name: 'current_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  public currentLongitude!: number | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
