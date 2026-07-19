import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'offboarding_task' })
@Index(['tenantId', 'offboardingCaseId'])
export class OffboardingTaskOrmEntity extends TenantAwareEntity {
  @Column({ name: 'offboarding_case_id', type: 'uuid' })
  public offboardingCaseId!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  public isCompleted!: boolean;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  public completedAt!: Date | null;
}
