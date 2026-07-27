import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'surge_rules' })
export class SurgeRuleOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 }) public name!: string;
  @Column({ type: 'varchar', length: 20 }) public trigger!: string;
  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1.0 }) public multiplier!: number;
  @Column({ name: 'min_orders', type: 'int', default: 0 }) public minOrders!: number;
  @Column({ name: 'max_drivers', type: 'int', default: 0 }) public maxDrivers!: number;
  @Column({ name: 'start_hour', type: 'int', nullable: true }) public startHour!: number | null;
  @Column({ name: 'end_hour', type: 'int', nullable: true }) public endHour!: number | null;
  @Column({ name: 'is_active', type: 'boolean', default: true }) public isActive!: boolean;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
