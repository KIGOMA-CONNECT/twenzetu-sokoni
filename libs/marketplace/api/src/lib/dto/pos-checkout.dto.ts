import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { POS_PAYMENT_METHODS } from '@afri-market/marketplace-domain';

export class PosCheckoutItemDto {
  @ApiProperty({ description: 'Product UUID' })
  @IsString()
  @MaxLength(50)
  productId!: string;

  @ApiProperty({ description: 'Quantity to sell', minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(9999)
  quantity!: number;
}

export class PosCheckoutDto {
  @ApiProperty({ type: [PosCheckoutItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PosCheckoutItemDto)
  items!: PosCheckoutItemDto[];

  @ApiPropertyOptional({ enum: POS_PAYMENT_METHODS, default: 'cash' })
  @IsOptional()
  @IsEnum(POS_PAYMENT_METHODS)
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Cash tendered by customer (for cash)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000)
  amountTendered?: number;
}