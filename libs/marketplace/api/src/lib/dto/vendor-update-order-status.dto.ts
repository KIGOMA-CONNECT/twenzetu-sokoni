import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VendorUpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'] })
  @IsEnum(['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'])
  @IsNotEmpty()
  status!: string;
}
