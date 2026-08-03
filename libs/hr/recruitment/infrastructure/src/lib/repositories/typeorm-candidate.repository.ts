import { TypeOrmRepository } from '@abms/database';
import { Email, EntityId, TenantId } from '@abms/kernel';
import { Candidate, ICandidateRepository } from '@abms/hr-recruitment-domain';
import { EntityManager } from 'typeorm';
import { CandidateOrmEntity } from '../entities/candidate-orm.entity';

export class TypeOrmCandidateRepository
  extends TypeOrmRepository<Candidate, CandidateOrmEntity, EntityId>
  implements ICandidateRepository
{
  public constructor(manager: EntityManager) {
    super(manager, CandidateOrmEntity);
  }

  public async findById(id: EntityId): Promise<Candidate | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<Candidate[]> {
    const rows = await this.repository.find({ where: { tenantId: tenantId.value } });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: Candidate): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email.value,
      phone: entity.phone,
      resumeUrl: entity.resumeUrl,
      source: entity.source,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: CandidateOrmEntity): Candidate {
    return Candidate.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      firstName: row.firstName,
      lastName: row.lastName,
      email: Email.create(row.email).getValue(),
      phone: row.phone,
      resumeUrl: row.resumeUrl,
      source: row.source,
    });
  }
}
