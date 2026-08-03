import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { IWorkflowInstanceRepository, WorkflowInstance, WorkflowInstanceStatus } from '@abms/workflow-domain';
import { EntityManager } from 'typeorm';
import { WorkflowInstanceOrmEntity } from '../entities/workflow-instance-orm.entity';

export class TypeOrmWorkflowInstanceRepository
  extends TypeOrmRepository<WorkflowInstance, WorkflowInstanceOrmEntity, EntityId>
  implements IWorkflowInstanceRepository
{
  public constructor(manager: EntityManager) {
    super(manager, WorkflowInstanceOrmEntity);
  }

  public async findById(id: EntityId): Promise<WorkflowInstance | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findBySubject(
    tenantId: TenantId,
    subjectType: string,
    subjectId: string,
  ): Promise<WorkflowInstance[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, subjectType, subjectId },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: WorkflowInstance): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      workflowDefinitionId: entity.workflowDefinitionId.toValue(),
      subjectType: entity.subjectType,
      subjectId: entity.subjectId,
      status: entity.status,
      steps: [...entity.steps],
      version: entity.version,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: WorkflowInstanceOrmEntity): WorkflowInstance {
    return WorkflowInstance.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      workflowDefinitionId: EntityId.create(row.workflowDefinitionId),
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      status: row.status as WorkflowInstanceStatus,
      steps: row.steps,
      version: row.version,
    });
  }
}
