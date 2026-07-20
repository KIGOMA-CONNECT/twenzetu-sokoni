import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  ISuccessionCandidateRepository,
  ReadinessLevel,
  SuccessionCandidate,
} from '@abms/hr-succession-domain';
import { EntityManager } from 'typeorm';
import { SuccessionCandidateOrmEntity } from '../entities/succession-candidate-orm.entity';

export class TypeOrmSuccessionCandidateRepository
  extends TypeOrmRepository<SuccessionCandidate, SuccessionCandidateOrmEntity, EntityId>
  implements ISuccessionCandidateRepository
{
  public constructor(manager: EntityManager) {
    super(manager, SuccessionCandidateOrmEntity);
  }

  public async findById(id: EntityId): Promise<SuccessionCandidate | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByPlanAndEmployee(
    tenantId: TenantId,
    successionPlanId: EntityId,
    employeeId: EntityId,
  ): Promise<SuccessionCandidate | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        successionPlanId: successionPlanId.toValue(),
        employeeId: employeeId.toValue(),
      },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByPlan(tenantId: TenantId, successionPlanId: EntityId): Promise<SuccessionCandidate[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, successionPlanId: successionPlanId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: SuccessionCandidate): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      successionPlanId: entity.successionPlanId.toValue(),
      employeeId: entity.employeeId.toValue(),
      readinessLevel: entity.readinessLevel,
      notes: entity.notes,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: SuccessionCandidateOrmEntity): SuccessionCandidate {
    return SuccessionCandidate.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      successionPlanId: EntityId.create(row.successionPlanId),
      employeeId: EntityId.create(row.employeeId),
      readinessLevel: row.readinessLevel as ReadinessLevel,
      notes: row.notes,
    });
  }
}
