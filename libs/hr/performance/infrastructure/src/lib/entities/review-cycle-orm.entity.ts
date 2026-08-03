import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'review_cycle' })
@Index(['tenantId', 'name'], { unique: true })
export class ReviewCycleOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 160 })
  public name!: string;

  @Column({ name: 'start_date', type: 'date' })
  public startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  public endDate!: string;

  @Column({ type: 'varchar', length: 16, default: 'OPEN' })
  public status!: string;
}
