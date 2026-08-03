import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import {
  IJobRequisitionRepository,
  JobRequisition,
  JobRequisitionStatus,
} from '@abms/hr-recruitment-domain';
import { JobRequisitionCloseReason } from '@abms/hr-recruitment-domain';
import { EntityManager } from 'typeorm';
import { JobRequisitionOrmEntity } from '../entities/job-requisition-orm.entity';

export class TypeOrmJobRequisitionRepository
  extends TypeOrmRepository<JobRequisition, JobRequisitionOrmEntity, EntityId>
  implements IJobRequisitionRepository
{
  public constructor(manager: EntityManager) {
    super(manager, JobRequisitionOrmEntity);
  }

  public async findById(id: EntityId): Promise<JobRequisition | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<JobRequisition[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: JobRequisition): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      positionId: entity.positionId.toValue(),
      title: entity.title,
      headcount: entity.headcount,
      status: entity.status,
      closeReason: entity.closeReason,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: JobRequisitionOrmEntity): JobRequisition {
    return JobRequisition.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      positionId: EntityId.create(row.positionId),
      title: row.title,
      headcount: row.headcount,
      status: row.status as JobRequisitionStatus,
      closeReason: row.closeReason as JobRequisitionCloseReason | null,
    });
  }
}
