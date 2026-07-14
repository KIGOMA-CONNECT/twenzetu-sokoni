import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { IWorkflowDefinitionRepository, WorkflowDefinition } from '@abms/workflow-domain';
import { EntityManager } from 'typeorm';
import { WorkflowDefinitionOrmEntity } from '../entities/workflow-definition-orm.entity';

export class TypeOrmWorkflowDefinitionRepository
  extends TypeOrmRepository<WorkflowDefinition, WorkflowDefinitionOrmEntity, EntityId>
  implements IWorkflowDefinitionRepository
{
  public constructor(manager: EntityManager) {
    super(manager, WorkflowDefinitionOrmEntity);
  }

  public async findById(id: EntityId): Promise<WorkflowDefinition | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByCode(tenantId: TenantId, code: string): Promise<WorkflowDefinition | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, code } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<WorkflowDefinition[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: WorkflowDefinition): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      code: entity.code,
      name: entity.name,
      steps: [...entity.steps],
      isActive: entity.isActive,
      version: entity.version,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: WorkflowDefinitionOrmEntity): WorkflowDefinition {
    return WorkflowDefinition.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      code: row.code,
      name: row.name,
      steps: row.steps,
      isActive: row.isActive,
      version: row.version,
    });
  }
}
