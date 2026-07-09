import { OrgUnitReadModel } from './org-unit-read-model';

export interface OrgUnitTreeNode extends OrgUnitReadModel {
  readonly children: OrgUnitTreeNode[];
}
