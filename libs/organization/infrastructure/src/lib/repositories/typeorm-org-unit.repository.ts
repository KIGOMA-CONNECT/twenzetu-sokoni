import { TypeOrmRepository } from '@abms/database';
import { ConcurrencyDomainException, EntityId, TenantId } from '@abms/kernel';
import { IOrgUnitRepository, OrgUnit, OrgUnitStatus } from '@abms/organization-domain';
import { EntityManager } from 'typeorm';
import { OrgUnitOrmEntity } from '../entities/org-unit-orm.entity';

interface ExistsRow {
  exists: boolean;
}

interface ParentRow {
  parent_id: string | null;
}

export class TypeOrmOrgUnitRepository
  extends TypeOrmRepository<OrgUnit, OrgUnitOrmEntity, EntityId>
  implements IOrgUnitRepository
{
  public constructor(private readonly manager: EntityManager) {
    super(manager, OrgUnitOrmEntity);
  }

  public async findById(id: EntityId): Promise<OrgUnit | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByCode(tenantId: TenantId, code: string): Promise<OrgUnit | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, code } });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async wouldCreateCycle(nodeId: EntityId, candidateNewParentId: EntityId): Promise<boolean> {
    const rows: ExistsRow[] = await this.manager.query(
      `SELECT EXISTS(
         SELECT 1 FROM "org_unit_closure" WHERE "ancestor_id" = $1 AND "descendant_id" = $2
       ) AS "exists"`,
      [nodeId.toValue(), candidateNewParentId.toValue()],
    );
    return rows[0]?.exists ?? false;
  }

  public async save(entity: OrgUnit): Promise<void> {
    const parentRows: ParentRow[] = await this.manager.query(
      `SELECT "parent_id" FROM "org_unit" WHERE "id" = $1`,
      [entity.id.toValue()],
    );

    if (parentRows.length === 0) {
      await this.insertNew(entity);
      return;
    }

    await this.updateExisting(entity, parentRows[0].parent_id);
  }

  public async delete(id: EntityId): Promise<void> {
    await this.manager.query(
      `DELETE FROM "org_unit_closure" WHERE "ancestor_id" = $1 OR "descendant_id" = $1`,
      [id.toValue()],
    );
    await this.repository.delete({ id: id.toValue() });
  }

  private async insertNew(entity: OrgUnit): Promise<void> {
    await this.repository.insert({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      orgUnitTypeId: entity.orgUnitTypeId.toValue(),
      parentId: entity.parentId?.toValue() ?? null,
      code: entity.code,
      name: entity.name,
      status: entity.status,
      sortOrder: entity.sortOrder,
      version: entity.version,
    });

    await this.manager.query(
      `INSERT INTO "org_unit_closure" ("ancestor_id", "descendant_id", "depth", "tenant_id")
       VALUES ($1, $1, 0, $2)`,
      [entity.id.toValue(), entity.tenantId.value],
    );

    if (entity.parentId) {
      await this.manager.query(
        `INSERT INTO "org_unit_closure" ("ancestor_id", "descendant_id", "depth", "tenant_id")
         SELECT "ancestor_id", $1, "depth" + 1, $2
         FROM "org_unit_closure"
         WHERE "descendant_id" = $3`,
        [entity.id.toValue(), entity.tenantId.value, entity.parentId.toValue()],
      );
    }
  }

  private async updateExisting(entity: OrgUnit, previousParentId: string | null): Promise<void> {
    const newParentId = entity.parentId?.toValue() ?? null;
    if (previousParentId !== newParentId) {
      await this.reparentClosure(entity.id, entity.parentId, entity.tenantId);
    }

    const result: [unknown[], number] = await this.manager.query(
      `UPDATE "org_unit"
       SET "code" = $1, "name" = $2, "status" = $3, "sort_order" = $4, "parent_id" = $5,
           "version" = "version" + 1, "updated_at" = now()
       WHERE "id" = $6 AND "version" = $7`,
      [
        entity.code,
        entity.name,
        entity.status,
        entity.sortOrder,
        newParentId,
        entity.id.toValue(),
        entity.version,
      ],
    );

    if (result[1] === 0) {
      throw new ConcurrencyDomainException('OrgUnit', entity.id.toValue());
    }
  }

  // Classic closure-table reparent: delete the crossing rows between the node's old
  // ancestors and its subtree, then insert new crossing rows for the new parent chain.
  private async reparentClosure(
    nodeId: EntityId,
    newParentId: EntityId | null,
    tenantId: TenantId,
  ): Promise<void> {
    await this.manager.query(
      `DELETE FROM "org_unit_closure"
       WHERE "descendant_id" IN (SELECT "descendant_id" FROM "org_unit_closure" WHERE "ancestor_id" = $1)
         AND "ancestor_id" IN (
           SELECT "ancestor_id" FROM "org_unit_closure" WHERE "descendant_id" = $1 AND "ancestor_id" <> "descendant_id"
         )`,
      [nodeId.toValue()],
    );

    if (newParentId) {
      await this.manager.query(
        `INSERT INTO "org_unit_closure" ("ancestor_id", "descendant_id", "depth", "tenant_id")
         SELECT supertree."ancestor_id", subtree."descendant_id", supertree."depth" + subtree."depth" + 1, $3
         FROM "org_unit_closure" supertree
         CROSS JOIN "org_unit_closure" subtree
         WHERE supertree."descendant_id" = $1 AND subtree."ancestor_id" = $2`,
        [newParentId.toValue(), nodeId.toValue(), tenantId.value],
      );
    }
  }

  private toDomain(row: OrgUnitOrmEntity): OrgUnit {
    return OrgUnit.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      orgUnitTypeId: EntityId.create(row.orgUnitTypeId),
      parentId: row.parentId ? EntityId.create(row.parentId) : null,
      code: row.code,
      name: row.name,
      status: row.status as OrgUnitStatus,
      sortOrder: row.sortOrder,
      version: row.version,
    });
  }
}
