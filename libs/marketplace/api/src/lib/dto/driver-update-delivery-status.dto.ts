import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DriverUpdateDeliveryStatusDto {
  @ApiProperty({ description: 'New delivery status', enum: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] })
  @IsEnum(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'])
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ description: 'Driver earnings' })
  @IsOptional()
  @IsNumber()
  driverEarnings?: number;
}
