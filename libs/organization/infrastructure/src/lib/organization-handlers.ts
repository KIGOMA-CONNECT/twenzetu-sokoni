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
import { CreateBranchProfileHandler } from './handlers/profiles/create-branch-profile.handler';
import { CreateCompanyProfileHandler } from './handlers/profiles/create-company-profile.handler';
import { CreateCostCenterProfileHandler } from './handlers/profiles/create-cost-center-profile.handler';
import { CreateDepartmentProfileHandler } from './handlers/profiles/create-department-profile.handler';
import { CreateProfitCenterProfileHandler } from './handlers/profiles/create-profit-center-profile.handler';
import { GetBranchProfileByOrgUnitIdHandler } from './handlers/profiles/get-branch-profile-by-org-unit-id.handler';
import { GetCompanyProfileByOrgUnitIdHandler } from './handlers/profiles/get-company-profile-by-org-unit-id.handler';
import { GetCostCenterProfileByOrgUnitIdHandler } from './handlers/profiles/get-cost-center-profile-by-org-unit-id.handler';
import { GetDepartmentProfileByOrgUnitIdHandler } from './handlers/profiles/get-department-profile-by-org-unit-id.handler';
import { GetProfitCenterProfileByOrgUnitIdHandler } from './handlers/profiles/get-profit-center-profile-by-org-unit-id.handler';
import { UpdateBranchProfileHandler } from './handlers/profiles/update-branch-profile.handler';
import { UpdateCompanyProfileHandler } from './handlers/profiles/update-company-profile.handler';
import { UpdateCostCenterProfileHandler } from './handlers/profiles/update-cost-center-profile.handler';
import { UpdateDepartmentProfileHandler } from './handlers/profiles/update-department-profile.handler';
import { UpdateProfitCenterProfileHandler } from './handlers/profiles/update-profit-center-profile.handler';

export const ORGANIZATION_COMMAND_HANDLERS = [
  CreateOrgUnitTypeHandler,
  CreateOrgUnitHandler,
  RenameOrgUnitHandler,
  MoveOrgUnitHandler,
  DeactivateOrgUnitHandler,
  ReactivateOrgUnitHandler,
  CreateCompanyProfileHandler,
  UpdateCompanyProfileHandler,
  CreateBranchProfileHandler,
  UpdateBranchProfileHandler,
  CreateDepartmentProfileHandler,
  UpdateDepartmentProfileHandler,
  CreateCostCenterProfileHandler,
  UpdateCostCenterProfileHandler,
  CreateProfitCenterProfileHandler,
  UpdateProfitCenterProfileHandler,
];

export const ORGANIZATION_QUERY_HANDLERS = [
  GetOrgUnitByIdHandler,
  GetOrgUnitTreeHandler,
  GetOrgUnitAncestorsHandler,
  ListOrgUnitTypesHandler,
  GetCompanyProfileByOrgUnitIdHandler,
  GetBranchProfileByOrgUnitIdHandler,
  GetDepartmentProfileByOrgUnitIdHandler,
  GetCostCenterProfileByOrgUnitIdHandler,
  GetProfitCenterProfileByOrgUnitIdHandler,
];
