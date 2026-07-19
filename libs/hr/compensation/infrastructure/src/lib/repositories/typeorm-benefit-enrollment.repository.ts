import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  BenefitEnrollment,
  BenefitEnrollmentStatus,
  IBenefitEnrollmentRepository,
} from '@abms/hr-compensation-domain';
import { EntityManager } from 'typeorm';
import { BenefitEnrollmentOrmEntity } from '../entities/benefit-enrollment-orm.entity';

export class TypeOrmBenefitEnrollmentRepository
  extends TypeOrmRepository<BenefitEnrollment, BenefitEnrollmentOrmEntity, EntityId>
  implements IBenefitEnrollmentRepository
{
  public constructor(manager: EntityManager) {
    super(manager, BenefitEnrollmentOrmEntity);
  }

  public async findById(id: EntityId): Promise<BenefitEnrollment | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findActiveByEmployeeAndPlan(
    tenantId: TenantId,
    employeeId: EntityId,
    benefitPlanId: EntityId,
  ): Promise<BenefitEnrollment | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        employeeId: employeeId.toValue(),
        benefitPlanId: benefitPlanId.toValue(),
        status: 'ACTIVE',
      },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<BenefitEnrollment[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: BenefitEnrollment): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      benefitPlanId: entity.benefitPlanId.toValue(),
      effectiveDate: entity.effectiveDate.toISOString().slice(0, 10),
      status: entity.status,
      cancelledAt: entity.cancelledAt,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: BenefitEnrollmentOrmEntity): BenefitEnrollment {
    return BenefitEnrollment.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      benefitPlanId: EntityId.create(row.benefitPlanId),
      effectiveDate: new Date(row.effectiveDate),
      status: row.status as BenefitEnrollmentStatus,
      cancelledAt: row.cancelledAt,
    });
  }
}
