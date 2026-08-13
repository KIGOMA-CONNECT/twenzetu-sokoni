import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBalanceSheetAccountDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(['asset', 'liability'])
  category!: 'asset' | 'liability';

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
