import { ICommand } from '@abms/kernel';

export class UpdateCompanyProfileCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly orgUnitId: string,
    public readonly legalName: string,
    public readonly registrationNumber: string,
    public readonly taxCountryCode: string,
    public readonly taxNumber: string,
    public readonly functionalCurrency: string,
    public readonly fiscalYearStartMonth: number,
    public readonly expectedVersion: number,
  ) {}
}
