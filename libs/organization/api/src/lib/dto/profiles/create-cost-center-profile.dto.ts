import { IsDateString, IsISO4217CurrencyCode, IsOptional, IsString, Matches } from 'class-validator';

const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;

export class CreateCostCenterProfileDto {
  @IsString()
  @Matches(DECIMAL_AMOUNT_PATTERN, {
    message: 'budgetAmount must be a non-negative decimal with at most 4 fraction digits.',
  })
  public budgetAmount!: string;

  @IsISO4217CurrencyCode()
  public budgetCurrency!: string;

  @IsDateString()
  public budgetPeriodStart!: string;

  @IsDateString()
  public budgetPeriodEnd!: string;

  @IsOptional()
  @IsString()
  public glAccountCode?: string;
}
