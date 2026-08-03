export interface CompanyProfileReadModel {
  readonly id: string;
  readonly orgUnitId: string;
  readonly legalName: string;
  readonly registrationNumber: string;
  readonly taxCountryCode: string;
  readonly taxNumber: string;
  readonly functionalCurrency: string;
  readonly fiscalYearStartMonth: number;
  readonly version: number;
}
