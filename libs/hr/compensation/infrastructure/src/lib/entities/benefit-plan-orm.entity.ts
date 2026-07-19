import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'benefit_plan' })
@Index(['tenantId'])
export class BenefitPlanOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 160 })
  public name!: string;

  @Column({ name: 'benefit_type', type: 'varchar', length: 24 })
  public benefitType!: string;

  @Column({ name: 'employer_contribution_rate_basis_points', type: 'integer' })
  public employerContributionRateBasisPoints!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
