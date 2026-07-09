import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { GetOrgUnitAncestorsQuery, OrgUnitReadModel } from '@abms/organization-application';
import { OrgUnitStatus } from '@abms/organization-domain';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';

interface OrgUnitRow {
  id: string;
  org_unit_type_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  status: OrgUnitStatus;
  sort_order: number;
  version: number;
}

@Injectable()
@QueryHandler(GetOrgUnitAncestorsQuery)
export class GetOrgUnitAncestorsHandler extends TransactionalQueryHandler<
  GetOrgUnitAncestorsQuery,
  OrgUnitReadModel[]
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetOrgUnitAncestorsQuery,
    ctx: ITransactionContext,
  ): Promise<OrgUnitReadModel[]> {
    const manager = getEntityManager(ctx);

    // Ordered breadcrumb, root-first; includes the node itself as the final (depth 0) entry.
    const rows: OrgUnitRow[] = await manager.query(
      `SELECT ou.* FROM "org_unit_closure" c
       JOIN "org_unit" ou ON ou.id = c.ancestor_id
       WHERE c.descendant_id = $1
       ORDER BY c.depth DESC`,
      [query.orgUnitId],
    );

    return rows.map((row) => ({
      id: row.id,
      orgUnitTypeId: row.org_unit_type_id,
      parentId: row.parent_id,
      code: row.code,
      name: row.name,
      status: row.status,
      sortOrder: row.sort_order,
      version: row.version,
    }));
  }
}
