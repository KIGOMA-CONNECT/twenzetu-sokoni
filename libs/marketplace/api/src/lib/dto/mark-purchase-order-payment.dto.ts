import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class MarkPurchaseOrderPaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  paid?: boolean;
}
