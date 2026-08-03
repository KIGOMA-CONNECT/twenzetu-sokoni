import { ICommand } from '@abms/kernel';

export interface CreateCompanyProfileResult {
  readonly id: string;
}

export class CreateCompanyProfileCommand implements ICommand<CreateCompanyProfileResult> {
  public readonly _resultType?: CreateCompanyProfileResult;

  public constructor(
    public readonly orgUnitId: string,
    public readonly legalName: string,
    public readonly registrationNumber: string,
    public readonly taxCountryCode: string,
    public readonly taxNumber: string,
    public readonly functionalCurrency: string,
    public readonly fiscalYearStartMonth: number,
  ) {}
}
