import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  ComplianceCategory,
  ComplianceRecurrence,
  ComplianceRequirement,
  IComplianceRequirementRepository,
} from '@abms/hr-compliance-domain';
import { EntityManager } from 'typeorm';
import { ComplianceRequirementOrmEntity } from '../entities/compliance-requirement-orm.entity';

export class TypeOrmComplianceRequirementRepository
  extends TypeOrmRepository<ComplianceRequirement, ComplianceRequirementOrmEntity, EntityId>
  implements IComplianceRequirementRepository
{
  public constructor(manager: EntityManager) {
    super(manager, ComplianceRequirementOrmEntity);
  }

  public async findById(id: EntityId): Promise<ComplianceRequirement | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<ComplianceRequirement[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: ComplianceRequirement): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      name: entity.name,
      description: entity.description,
      category: entity.category,
      recurrence: entity.recurrence,
      isActive: entity.isActive,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: ComplianceRequirementOrmEntity): ComplianceRequirement {
    return ComplianceRequirement.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      name: row.name,
      description: row.description,
      category: row.category as ComplianceCategory,
      recurrence: row.recurrence as ComplianceRecurrence,
      isActive: row.isActive,
    });
  }
}
