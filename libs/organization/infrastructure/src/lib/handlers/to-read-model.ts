import { OrgUnitReadModel, OrgUnitTypeReadModel } from '@abms/organization-application';
import { OrgUnit, OrgUnitType } from '@abms/organization-domain';

export function toOrgUnitReadModel(orgUnit: OrgUnit): OrgUnitReadModel {
  return {
    id: orgUnit.id.toValue(),
    orgUnitTypeId: orgUnit.orgUnitTypeId.toValue(),
    parentId: orgUnit.parentId?.toValue() ?? null,
    code: orgUnit.code,
    name: orgUnit.name,
    status: orgUnit.status,
    sortOrder: orgUnit.sortOrder,
    version: orgUnit.version,
  };
}

export function toOrgUnitTypeReadModel(orgUnitType: OrgUnitType): OrgUnitTypeReadModel {
  return {
    id: orgUnitType.id.toValue(),
    code: orgUnitType.code,
    name: orgUnitType.name,
    description: orgUnitType.description,
    isSystemDefined: orgUnitType.isSystemDefined,
    isActive: orgUnitType.isActive,
    sortOrder: orgUnitType.sortOrder,
    allowedParentTypeIds: orgUnitType.allowedParentTypeIds.map((id) => id.toValue()),
  };
}
