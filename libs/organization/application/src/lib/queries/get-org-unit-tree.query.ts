import { IQuery } from '@abms/kernel';
import { OrgUnitTreeNode } from '../read-models/org-unit-tree-node';

export class GetOrgUnitTreeQuery implements IQuery<OrgUnitTreeNode[]> {
  public readonly _resultType?: OrgUnitTreeNode[];

  public constructor(public readonly rootId?: string) {}
}
