import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteDeliveryDto {
  @ApiPropertyOptional({ description: 'Driver earnings' })
  @IsOptional()
  @IsNumber()
  driverEarnings?: number;
}
