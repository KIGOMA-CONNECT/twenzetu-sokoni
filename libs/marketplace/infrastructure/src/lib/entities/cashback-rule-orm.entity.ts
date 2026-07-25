import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'cashback_rules' })
export class CashbackRuleOrmEntity extends TenantAwareEntity {
  @Column({ name: 'source_service', type: 'varchar', length: 50 }) public sourceService!: string;
  @Column({ name: 'target_service', type: 'varchar', length: 50 }) public targetService!: string;
  @Column({ type: 'decimal', precision: 5, scale: 2 }) public percentage!: number;
  @Column({ name: 'max_cashback', type: 'decimal', precision: 12, scale: 2 }) public maxCashback!: number;
  @Column({ name: 'is_active', type: 'boolean', default: true }) public isActive!: boolean;
}
