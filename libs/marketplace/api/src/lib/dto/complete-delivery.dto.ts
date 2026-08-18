import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteDeliveryDto {
  @ApiPropertyOptional({ description: 'Delivery confirmation code provided by the customer' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'deliveryOtp must be a 4-6 digit code' })
  deliveryOtp?: string;
}
