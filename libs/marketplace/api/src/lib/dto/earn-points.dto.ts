import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EarnPointsDto {
  @ApiProperty({ description: 'Order ID that earned these points' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ description: 'Order total amount' })
  @IsNumber()
  @Min(0)
  orderTotal!: number;

  @ApiPropertyOptional({ description: 'Customer to credit (defaults to current user)' })
  @IsString()
  @IsOptional()
  customerId?: string;
}
