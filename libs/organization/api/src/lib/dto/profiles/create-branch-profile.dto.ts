import { IsEmail, IsISO31661Alpha2, IsISO4217CurrencyCode, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBranchProfileDto {
  @IsString()
  @IsNotEmpty()
  public addressLine1!: string;

  @IsOptional()
  @IsString()
  public addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  public addressCity!: string;

  @IsOptional()
  @IsString()
  public addressStateOrRegion?: string;

  @IsOptional()
  @IsString()
  public addressPostalCode?: string;

  @IsISO31661Alpha2()
  public addressCountryCode!: string;

  @IsISO4217CurrencyCode()
  public operatingCurrency!: string;

  @IsOptional()
  @IsString()
  public contactPhone?: string;

  @IsOptional()
  @IsEmail()
  public contactEmail?: string;
}
