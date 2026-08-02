import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  @IsEnum(['percentage', 'fixed'])
  discountType!: 'percentage' | 'fixed';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsageCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsagePerUser?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateFlashSaleDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  originalPrice!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  salePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  maxQuantity!: number;

  @ApiProperty()
  @IsISO8601()
  startsAt!: string;

  @ApiProperty()
  @IsISO8601()
  endsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
