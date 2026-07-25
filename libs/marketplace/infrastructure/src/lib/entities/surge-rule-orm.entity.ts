import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'surge_rules' })
export class SurgeRuleOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 }) public name!: string;
  @Column({ type: 'varchar', length: 20 }) public trigger!: string;
  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1.0 }) public multiplier!: number;
  @Column({ type: 'int', default: 0 }) public minOrders!: number;
  @Column({ type: 'int', default: 0 }) public maxDrivers!: number;
  @Column({ type: 'int', nullable: true }) public startHour!: number | null;
  @Column({ type: 'int', nullable: true }) public endHour!: number | null;
  @Column({ type: 'boolean', default: true }) public isActive!: boolean;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
