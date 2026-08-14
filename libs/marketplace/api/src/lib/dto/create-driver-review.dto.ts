import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverReviewDto {
  @ApiProperty({ description: 'Order ID', example: '00000000-0000-0000-0000-000000000001' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ description: 'Rating 1-5', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ description: 'Optional comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
