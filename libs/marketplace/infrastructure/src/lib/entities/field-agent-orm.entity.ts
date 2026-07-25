import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'field_agents' })
@Index(['user_id'])
export class FieldAgentOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid' }) public userId!: string;
  @Column({ name: 'agent_type', type: 'varchar', length: 20 }) public agentType!: string;
  @Column({ name: 'agent_code', type: 'varchar', length: 20, unique: true }) public agentCode!: string;
  @Column({ name: 'coverage_area', type: 'varchar', length: 200 }) public coverageArea!: string;
  @Column({ name: 'total_onboarded', type: 'int', default: 0 }) public totalOnboarded!: number;
  @Column({ name: 'total_earnings', type: 'decimal', precision: 12, scale: 2, default: 0 }) public totalEarnings!: number;
  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 1.0 }) public commissionRate!: number;
  @Column({ type: 'varchar', length: 10, default: 'TZS' }) public currency!: string;
  @Column({ type: 'varchar', length: 20, default: 'PENDING' }) public status!: string;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
