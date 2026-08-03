import { IsDateString, IsISO4217CurrencyCode, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;

export class UpdateCostCenterProfileDto {
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

  @IsInt()
  @Min(1)
  public expectedVersion!: number;
}
