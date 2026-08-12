import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ACCOUNTING_PERIODS } from '@afri-market/marketplace-application';

export class VendorAccountingQueryDto {
  @ApiPropertyOptional({ enum: [...ACCOUNTING_PERIODS], default: '30d', description: 'Preset period' })
  @IsOptional()
  @IsString()
  @IsIn([...ACCOUNTING_PERIODS])
  period?: string;

  @ApiPropertyOptional({ description: 'Custom range start (YYYY-MM-DD), overrides period' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ description: 'Custom range end (YYYY-MM-DD), overrides period' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}