import { IsISO31661Alpha2, IsISO4217CurrencyCode, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsString()
  @IsNotEmpty()
  public legalName!: string;

  @IsString()
  @IsNotEmpty()
  public registrationNumber!: string;

  @IsISO31661Alpha2()
  public taxCountryCode!: string;

  @IsString()
  @IsNotEmpty()
  public taxNumber!: string;

  @IsISO4217CurrencyCode()
  public functionalCurrency!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  public fiscalYearStartMonth!: number;

  @IsInt()
  @Min(1)
  public expectedVersion!: number;
}
