import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  vendorId!: string;

  @IsEnum(['food', 'grocery', 'laundry', 'secondhand', 'procurement', 'general', 'service'])
  type!: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @IsOptional()
  @IsNumber()
  deliveryLatitude?: number;

  @IsOptional()
  @IsNumber()
  deliveryLongitude?: number;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsEnum(['mpesa', 'tigo_money', 'airtel_money', 'cash'])
  paymentMethod?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
