import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'benefit_enrollment' })
@Index(['tenantId', 'employeeId'])
export class BenefitEnrollmentOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'benefit_plan_id', type: 'uuid' })
  public benefitPlanId!: string;

  @Column({ name: 'effective_date', type: 'date' })
  public effectiveDate!: string;

  @Column({ type: 'varchar', length: 16, default: 'ACTIVE' })
  public status!: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  public cancelledAt!: Date | null;
}
