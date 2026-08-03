import { IsDateString, IsIn, IsNumber, Min } from 'class-validator';

const REASONS = [
  'MERIT_INCREASE',
  'PROMOTION',
  'MARKET_ADJUSTMENT',
  'COST_OF_LIVING_ADJUSTMENT',
  'DEMOTION',
  'OTHER',
] as const;

export class RecordSalaryRevisionDto {
  @IsIn(REASONS)
  public reason!: (typeof REASONS)[number];

  @IsNumber()
  @Min(0)
  public newBasicSalary!: number;

  @IsDateString()
  public effectiveDate!: string;
}
