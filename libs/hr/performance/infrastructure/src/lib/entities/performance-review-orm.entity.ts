import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'performance_review' })
@Index(['tenantId', 'employeeId', 'reviewCycleId'], { unique: true })
export class PerformanceReviewOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'review_cycle_id', type: 'uuid' })
  public reviewCycleId!: string;

  @Column({ name: 'reviewer_user_id', type: 'uuid' })
  public reviewerUserId!: string;

  @Column({ type: 'integer', nullable: true })
  public rating!: number | null;

  @Column({ type: 'text', nullable: true })
  public comments!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'DRAFT' })
  public status!: string;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  public submittedAt!: Date | null;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  public acknowledgedAt!: Date | null;
}
