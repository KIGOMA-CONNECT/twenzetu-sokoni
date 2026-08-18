import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverUpdateDeliveryStatusDto {
  @ApiProperty({ description: 'New delivery status', enum: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'] })
  @IsEnum(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'])
  @IsNotEmpty()
  status!: string;
}
