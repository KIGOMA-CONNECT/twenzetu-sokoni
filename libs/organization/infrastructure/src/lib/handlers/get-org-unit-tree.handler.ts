import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { GetOrgUnitTreeQuery, OrgUnitTreeNode } from '@abms/organization-application';
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
@QueryHandler(GetOrgUnitTreeQuery)
export class GetOrgUnitTreeHandler extends TransactionalQueryHandler<
  GetOrgUnitTreeQuery,
  OrgUnitTreeNode[]
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetOrgUnitTreeQuery,
    ctx: ITransactionContext,
  ): Promise<OrgUnitTreeNode[]> {
    const manager = getEntityManager(ctx);

    const rows: OrgUnitRow[] = query.rootId
      ? await manager.query(
          `SELECT ou.* FROM "org_unit_closure" c
           JOIN "org_unit" ou ON ou.id = c.descendant_id
           WHERE c.ancestor_id = $1`,
          [query.rootId],
        )
      : await manager.query(`SELECT * FROM "org_unit"`);

    const nodesById = new Map<string, OrgUnitTreeNode>();
    for (const row of rows) {
      nodesById.set(row.id, {
        id: row.id,
        orgUnitTypeId: row.org_unit_type_id,
        parentId: row.parent_id,
        code: row.code,
        name: row.name,
        status: row.status,
        sortOrder: row.sort_order,
        version: row.version,
        children: [],
      });
    }

    const roots: OrgUnitTreeNode[] = [];
    for (const node of nodesById.values()) {
      const parent = node.parentId ? nodesById.get(node.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
