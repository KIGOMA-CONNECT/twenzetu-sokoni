import {
  BranchProfileReadModel,
  CompanyProfileReadModel,
  CostCenterProfileReadModel,
  DepartmentProfileReadModel,
  ProfitCenterProfileReadModel,
} from '@abms/organization-application';
import {
  BranchProfile,
  CompanyProfile,
  CostCenterProfile,
  DepartmentProfile,
  ProfitCenterProfile,
} from '@abms/organization-domain';

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toCompanyProfileReadModel(profile: CompanyProfile): CompanyProfileReadModel {
  return {
    id: profile.id.toValue(),
    orgUnitId: profile.orgUnitId.toValue(),
    legalName: profile.legalName,
    registrationNumber: profile.registrationNumber,
    taxCountryCode: profile.taxIdentifier.countryCode.value,
    taxNumber: profile.taxIdentifier.taxNumber,
    functionalCurrency: profile.functionalCurrency.value,
    fiscalYearStartMonth: profile.fiscalYearStartMonth,
    version: profile.version,
  };
}

export function toBranchProfileReadModel(profile: BranchProfile): BranchProfileReadModel {
  return {
    id: profile.id.toValue(),
    orgUnitId: profile.orgUnitId.toValue(),
    addressLine1: profile.address.line1,
    addressLine2: profile.address.line2,
    addressCity: profile.address.city,
    addressStateOrRegion: profile.address.stateOrRegion,
    addressPostalCode: profile.address.postalCode,
    addressCountryCode: profile.address.countryCode.value,
    operatingCurrency: profile.operatingCurrency.value,
    contactPhone: profile.contactPhone,
    contactEmail: profile.contactEmail,
    version: profile.version,
  };
}

export function toDepartmentProfileReadModel(profile: DepartmentProfile): DepartmentProfileReadModel {
  return {
    id: profile.id.toValue(),
    orgUnitId: profile.orgUnitId.toValue(),
    costCenterOrgUnitId: profile.costCenterOrgUnitId?.toValue() ?? null,
    managerReference: profile.managerReference,
    version: profile.version,
  };
}

export function toCostCenterProfileReadModel(profile: CostCenterProfile): CostCenterProfileReadModel {
  return {
    id: profile.id.toValue(),
    orgUnitId: profile.orgUnitId.toValue(),
    budgetAmount: profile.budget.amount,
    budgetCurrency: profile.budget.currency.value,
    budgetPeriodStart: toDateOnlyString(profile.budgetPeriodStart),
    budgetPeriodEnd: toDateOnlyString(profile.budgetPeriodEnd),
    glAccountCode: profile.glAccountCode,
    version: profile.version,
  };
}

export function toProfitCenterProfileReadModel(profile: ProfitCenterProfile): ProfitCenterProfileReadModel {
  return {
    id: profile.id.toValue(),
    orgUnitId: profile.orgUnitId.toValue(),
    revenueTargetAmount: profile.revenueTarget.amount,
    revenueTargetCurrency: profile.revenueTarget.currency.value,
    reportingCurrency: profile.reportingCurrency.value,
    glAccountCode: profile.glAccountCode,
    version: profile.version,
  };
}
