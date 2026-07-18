import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'candidate' })
@Index(['tenantId'])
export class CandidateOrmEntity extends TenantAwareEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 120 })
  public firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 120 })
  public lastName!: string;

  @Column({ type: 'varchar', length: 255 })
  public email!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  public phone!: string | null;

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  public resumeUrl!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  public source!: string | null;
}
