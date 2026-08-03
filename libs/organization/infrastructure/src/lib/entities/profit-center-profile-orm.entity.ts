import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'profit_center_profile' })
@Index(['orgUnitId'], { unique: true })
export class ProfitCenterProfileOrmEntity extends TenantAwareEntity {
  @Column({ name: 'org_unit_id', type: 'uuid' })
  public orgUnitId!: string;

  @Column({ name: 'revenue_target_amount', type: 'numeric', precision: 18, scale: 4 })
  public revenueTargetAmount!: string;

  @Column({ name: 'revenue_target_currency', type: 'varchar', length: 3 })
  public revenueTargetCurrency!: string;

  @Column({ name: 'reporting_currency', type: 'varchar', length: 3 })
  public reportingCurrency!: string;

  @Column({ name: 'gl_account_code', type: 'varchar', length: 64, nullable: true })
  public glAccountCode!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
