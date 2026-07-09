import { TypeOrmRepository } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { IOrgUnitTypeRepository, OrgUnitType } from '@abms/organization-domain';
import { EntityManager } from 'typeorm';
import { OrgUnitTypeOrmEntity } from '../entities/org-unit-type-orm.entity';

interface AllowedParentRow {
  allowed_parent_type_id: string;
}

export class TypeOrmOrgUnitTypeRepository
  extends TypeOrmRepository<OrgUnitType, OrgUnitTypeOrmEntity, EntityId>
  implements IOrgUnitTypeRepository
{
  public constructor(private readonly manager: EntityManager) {
    super(manager, OrgUnitTypeOrmEntity);
  }

  public async findById(id: EntityId): Promise<OrgUnitType | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByCode(tenantId: TenantId, code: string): Promise<OrgUnitType | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, code } });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByTenant(tenantId: TenantId): Promise<OrgUnitType[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value },
      order: { sortOrder: 'ASC' },
    });
    return Promise.all(rows.map((row) => this.toDomain(row)));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: OrgUnitType): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      isSystemDefined: entity.isSystemDefined,
      isActive: entity.isActive,
      sortOrder: entity.sortOrder,
    });

    await this.manager.query(`DELETE FROM "org_unit_type_allowed_parent" WHERE "org_unit_type_id" = $1`, [
      entity.id.toValue(),
    ]);
    for (const allowedParentTypeId of entity.allowedParentTypeIds) {
      await this.manager.query(
        `INSERT INTO "org_unit_type_allowed_parent"
           ("org_unit_type_id", "allowed_parent_type_id", "tenant_id")
         VALUES ($1, $2, $3)`,
        [entity.id.toValue(), allowedParentTypeId.toValue(), entity.tenantId.value],
      );
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private async toDomain(row: OrgUnitTypeOrmEntity): Promise<OrgUnitType> {
    const allowedParentRows: AllowedParentRow[] = await this.manager.query(
      `SELECT "allowed_parent_type_id" FROM "org_unit_type_allowed_parent" WHERE "org_unit_type_id" = $1`,
      [row.id],
    );

    return OrgUnitType.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      code: row.code,
      name: row.name,
      description: row.description,
      isSystemDefined: row.isSystemDefined,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      allowedParentTypeIds: allowedParentRows.map((allowedParentRow) =>
        EntityId.create(allowedParentRow.allowed_parent_type_id),
      ),
    });
  }
}
