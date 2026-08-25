import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class InternalTopupConfirmDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkoutRequestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptNumber?: string;
}
