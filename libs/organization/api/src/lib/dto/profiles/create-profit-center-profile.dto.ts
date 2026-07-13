import { IsISO4217CurrencyCode, IsOptional, IsString, Matches } from 'class-validator';

const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;

export class CreateProfitCenterProfileDto {
  @IsString()
  @Matches(DECIMAL_AMOUNT_PATTERN, {
    message: 'revenueTargetAmount must be a non-negative decimal with at most 4 fraction digits.',
  })
  public revenueTargetAmount!: string;

  @IsISO4217CurrencyCode()
  public revenueTargetCurrency!: string;

  @IsISO4217CurrencyCode()
  public reportingCurrency!: string;

  @IsOptional()
  @IsString()
  public glAccountCode?: string;
}
