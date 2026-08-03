import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { Application, ApplicationStatus, IApplicationRepository } from '@abms/hr-recruitment-domain';
import { EntityManager } from 'typeorm';
import { ApplicationOrmEntity } from '../entities/application-orm.entity';

export class TypeOrmApplicationRepository
  extends TypeOrmRepository<Application, ApplicationOrmEntity, EntityId>
  implements IApplicationRepository
{
  public constructor(manager: EntityManager) {
    super(manager, ApplicationOrmEntity);
  }

  public async findById(id: EntityId): Promise<Application | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByJobRequisition(
    tenantId: TenantId,
    jobRequisitionId: EntityId,
  ): Promise<Application[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, jobRequisitionId: jobRequisitionId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async findAllByCandidate(tenantId: TenantId, candidateId: EntityId): Promise<Application[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, candidateId: candidateId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: Application): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      candidateId: entity.candidateId.toValue(),
      jobRequisitionId: entity.jobRequisitionId.toValue(),
      status: entity.status,
      decisionNotes: entity.decisionNotes,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: ApplicationOrmEntity): Application {
    return Application.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      candidateId: EntityId.create(row.candidateId),
      jobRequisitionId: EntityId.create(row.jobRequisitionId),
      status: row.status as ApplicationStatus,
      decisionNotes: row.decisionNotes,
    });
  }
}
