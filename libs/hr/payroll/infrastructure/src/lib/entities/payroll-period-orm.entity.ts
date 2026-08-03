import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'payroll_period' })
@Index(['tenantId', 'year', 'month'], { unique: true })
export class PayrollPeriodOrmEntity extends TenantAwareEntity {
  @Column({ type: 'integer' })
  public year!: number;

  @Column({ type: 'integer' })
  public month!: number;

  @Column({ type: 'varchar', length: 16, default: 'OPEN' })
  public status!: string;
}
