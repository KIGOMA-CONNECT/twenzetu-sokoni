import { BranchProfileOrmEntity } from './entities/branch-profile-orm.entity';
import { CompanyProfileOrmEntity } from './entities/company-profile-orm.entity';
import { CostCenterProfileOrmEntity } from './entities/cost-center-profile-orm.entity';
import { DepartmentProfileOrmEntity } from './entities/department-profile-orm.entity';
import { OrgUnitOrmEntity } from './entities/org-unit-orm.entity';
import { OrgUnitTypeOrmEntity } from './entities/org-unit-type-orm.entity';
import { ProfitCenterProfileOrmEntity } from './entities/profit-center-profile-orm.entity';

export const ORGANIZATION_ENTITIES = [
  OrgUnitOrmEntity,
  OrgUnitTypeOrmEntity,
  CompanyProfileOrmEntity,
  BranchProfileOrmEntity,
  DepartmentProfileOrmEntity,
  CostCenterProfileOrmEntity,
  ProfitCenterProfileOrmEntity,
];
