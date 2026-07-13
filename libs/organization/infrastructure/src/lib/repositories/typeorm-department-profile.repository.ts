import { TypeOrmRepository } from '@abms/database';
import { ConcurrencyDomainException, EntityId, TenantId } from '@abms/kernel';
import { DepartmentProfile, IDepartmentProfileRepository } from '@abms/organization-domain';
import { EntityManager } from 'typeorm';
import { DepartmentProfileOrmEntity } from '../entities/department-profile-orm.entity';

interface ExistsRow {
  exists: boolean;
}

export class TypeOrmDepartmentProfileRepository
  extends TypeOrmRepository<DepartmentProfile, DepartmentProfileOrmEntity, EntityId>
  implements IDepartmentProfileRepository
{
  public constructor(private readonly manager: EntityManager) {
    super(manager, DepartmentProfileOrmEntity);
  }

  public async findById(id: EntityId): Promise<DepartmentProfile | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByOrgUnitId(orgUnitId: EntityId): Promise<DepartmentProfile | null> {
    const row = await this.repository.findOne({ where: { orgUnitId: orgUnitId.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: DepartmentProfile): Promise<void> {
    const rows: ExistsRow[] = await this.manager.query(
      `SELECT EXISTS(SELECT 1 FROM "department_profile" WHERE "id" = $1) AS "exists"`,
      [entity.id.toValue()],
    );

    if (!rows[0]?.exists) {
      await this.insertNew(entity);
      return;
    }
    await this.updateExisting(entity);
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private async insertNew(entity: DepartmentProfile): Promise<void> {
    await this.repository.insert({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      orgUnitId: entity.orgUnitId.toValue(),
      costCenterOrgUnitId: entity.costCenterOrgUnitId?.toValue() ?? null,
      managerReference: entity.managerReference,
      version: entity.version,
    });
  }

  private async updateExisting(entity: DepartmentProfile): Promise<void> {
    const result: [unknown[], number] = await this.manager.query(
      `UPDATE "department_profile"
       SET "cost_center_org_unit_id" = $1, "manager_reference" = $2,
           "version" = "version" + 1, "updated_at" = now()
       WHERE "id" = $3 AND "version" = $4`,
      [
        entity.costCenterOrgUnitId?.toValue() ?? null,
        entity.managerReference,
        entity.id.toValue(),
        entity.version,
      ],
    );

    if (result[1] === 0) {
      throw new ConcurrencyDomainException('DepartmentProfile', entity.id.toValue());
    }
  }

  private toDomain(row: DepartmentProfileOrmEntity): DepartmentProfile {
    return DepartmentProfile.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      orgUnitId: EntityId.create(row.orgUnitId),
      costCenterOrgUnitId: row.costCenterOrgUnitId ? EntityId.create(row.costCenterOrgUnitId) : null,
      managerReference: row.managerReference,
      version: row.version,
    });
  }
}
