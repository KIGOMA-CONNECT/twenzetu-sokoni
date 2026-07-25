import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VendorUpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: ['CONFIRMED', 'PREPARING', 'READY', 'CANCELLED'] })
  @IsEnum(['CONFIRMED', 'PREPARING', 'READY', 'CANCELLED'])
  @IsNotEmpty()
  status!: string;
}
