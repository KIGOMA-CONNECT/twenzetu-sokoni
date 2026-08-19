import { IsEnum, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverUpdateDeliveryStatusDto {
  @ApiProperty({ description: 'New delivery status', enum: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'] })
  @IsEnum(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'])
  @IsNotEmpty()
  status!: string;

  @ApiProperty({ description: 'Pickup confirmation code shared by the vendor (required for PICKED_UP)', required: false })
  @IsOptional()
  @Matches(/^\d{4,6}$/, { message: 'pickupOtp must be a 4-6 digit code' })
  pickupOtp?: string;
}
