import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'cost_center_profile' })
@Index(['orgUnitId'], { unique: true })
export class CostCenterProfileOrmEntity extends TenantAwareEntity {
  @Column({ name: 'org_unit_id', type: 'uuid' })
  public orgUnitId!: string;

  @Column({ name: 'budget_amount', type: 'numeric', precision: 18, scale: 4 })
  public budgetAmount!: string;

  @Column({ name: 'budget_currency', type: 'varchar', length: 3 })
  public budgetCurrency!: string;

  @Column({ name: 'budget_period_start', type: 'date' })
  public budgetPeriodStart!: string;

  @Column({ name: 'budget_period_end', type: 'date' })
  public budgetPeriodEnd!: string;

  @Column({ name: 'gl_account_code', type: 'varchar', length: 64, nullable: true })
  public glAccountCode!: string | null;

  @Column({ type: 'integer', default: 1 })
  public version!: number;
}
