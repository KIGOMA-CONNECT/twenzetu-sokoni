import { BusinessRuleViolationException } from '@abms/kernel';
import { OrgUnit, OrgUnitType } from '@abms/organization-domain';

/**
 * Enforces that a type-specific profile (Company/Branch/Department/CostCenter/ProfitCenter)
 * only attaches to an OrgUnit whose OrgUnitType.code matches. OrgUnitType.code is mutable
 * data, not a closed enum, so this is an application-layer check, not a schema constraint —
 * an accepted, documented limitation. See ADR-0004.
 */
export function assertOrgUnitType(orgUnit: OrgUnit, orgUnitType: OrgUnitType, expectedCode: string): void {
  if (orgUnitType.code !== expectedCode) {
    throw new BusinessRuleViolationException(
      `Org unit "${orgUnit.id.toValue()}" has type "${orgUnitType.code}", but a ${expectedCode} profile requires an org unit of type "${expectedCode}".`,
    );
  }
}
