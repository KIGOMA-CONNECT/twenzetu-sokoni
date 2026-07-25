import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubmitQuoteDto {
  @IsString()
  @IsNotEmpty()
  procurementId!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(['original', 'refurbished', 'copy_grade_a', 'copy_grade_b'])
  itemCondition!: string;

  @IsOptional()
  @IsNumber()
  warrantyPeriodDays?: number;
}
