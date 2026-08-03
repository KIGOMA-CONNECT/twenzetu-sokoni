import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'application' })
@Index(['tenantId', 'candidateId', 'jobRequisitionId'], { unique: true })
export class ApplicationOrmEntity extends TenantAwareEntity {
  @Column({ name: 'candidate_id', type: 'uuid' })
  public candidateId!: string;

  @Column({ name: 'job_requisition_id', type: 'uuid' })
  public jobRequisitionId!: string;

  @Column({ type: 'varchar', length: 16, default: 'APPLIED' })
  public status!: string;

  @Column({ name: 'decision_notes', type: 'text', nullable: true })
  public decisionNotes!: string | null;
}
