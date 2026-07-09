import { CreateOrgUnitTypeHandler } from './handlers/create-org-unit-type.handler';
import { CreateOrgUnitHandler } from './handlers/create-org-unit.handler';
import { DeactivateOrgUnitHandler } from './handlers/deactivate-org-unit.handler';
import { GetOrgUnitAncestorsHandler } from './handlers/get-org-unit-ancestors.handler';
import { GetOrgUnitByIdHandler } from './handlers/get-org-unit-by-id.handler';
import { GetOrgUnitTreeHandler } from './handlers/get-org-unit-tree.handler';
import { ListOrgUnitTypesHandler } from './handlers/list-org-unit-types.handler';
import { MoveOrgUnitHandler } from './handlers/move-org-unit.handler';
import { ReactivateOrgUnitHandler } from './handlers/reactivate-org-unit.handler';
import { RenameOrgUnitHandler } from './handlers/rename-org-unit.handler';

export const ORGANIZATION_COMMAND_HANDLERS = [
  CreateOrgUnitTypeHandler,
  CreateOrgUnitHandler,
  RenameOrgUnitHandler,
  MoveOrgUnitHandler,
  DeactivateOrgUnitHandler,
  ReactivateOrgUnitHandler,
];

export const ORGANIZATION_QUERY_HANDLERS = [
  GetOrgUnitByIdHandler,
  GetOrgUnitTreeHandler,
  GetOrgUnitAncestorsHandler,
  ListOrgUnitTypesHandler,
];
