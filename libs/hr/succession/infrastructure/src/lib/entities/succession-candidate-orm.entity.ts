import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'succession_candidate' })
@Index(['tenantId', 'successionPlanId'])
export class SuccessionCandidateOrmEntity extends TenantAwareEntity {
  @Column({ name: 'succession_plan_id', type: 'uuid' })
  public successionPlanId!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'readiness_level', type: 'varchar', length: 24 })
  public readinessLevel!: string;

  @Column({ type: 'text', nullable: true })
  public notes!: string | null;
}
