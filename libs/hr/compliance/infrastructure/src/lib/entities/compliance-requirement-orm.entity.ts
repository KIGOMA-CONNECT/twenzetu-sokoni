import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'compliance_requirement' })
@Index(['tenantId'])
export class ComplianceRequirementOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  public name!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ type: 'varchar', length: 24 })
  public category!: string;

  @Column({ type: 'varchar', length: 16 })
  public recurrence!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
