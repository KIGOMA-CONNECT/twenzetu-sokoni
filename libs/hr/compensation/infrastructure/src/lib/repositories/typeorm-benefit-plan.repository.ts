import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { BenefitPlan, BenefitType, IBenefitPlanRepository } from '@abms/hr-compensation-domain';
import { EntityManager } from 'typeorm';
import { BenefitPlanOrmEntity } from '../entities/benefit-plan-orm.entity';

export class TypeOrmBenefitPlanRepository
  extends TypeOrmRepository<BenefitPlan, BenefitPlanOrmEntity, EntityId>
  implements IBenefitPlanRepository
{
  public constructor(manager: EntityManager) {
    super(manager, BenefitPlanOrmEntity);
  }

  public async findById(id: EntityId): Promise<BenefitPlan | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<BenefitPlan[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: BenefitPlan): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      name: entity.name,
      benefitType: entity.benefitType,
      employerContributionRateBasisPoints: entity.employerContributionRateBasisPoints,
      isActive: entity.isActive,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: BenefitPlanOrmEntity): BenefitPlan {
    return BenefitPlan.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      name: row.name,
      benefitType: row.benefitType as BenefitType,
      employerContributionRateBasisPoints: row.employerContributionRateBasisPoints,
      isActive: row.isActive,
    });
  }
}
