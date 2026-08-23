import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  productId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productName!: string;

  @IsNumber()
  @Min(1)
  @Max(9999)
  quantity!: number;

  @IsNumber()
  @Min(0)
  @Max(100000000)
  unitPrice!: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vendorId!: string;

  @IsEnum(['food', 'grocery', 'laundry', 'secondhand', 'procurement', 'general', 'service'])
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  deliveryAddress!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLongitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string;

  @IsOptional()
  @IsEnum(['mpesa', 'tigo_money', 'tigo_pesa', 'airtel_money', 'halotel', 'azampesa', 'cash'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
