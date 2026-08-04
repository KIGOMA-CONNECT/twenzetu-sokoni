import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CheckoutCartDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  cartId!: string;

  @IsOptional()
  @IsEnum(['mpesa', 'tigo_money', 'tigo_pesa', 'airtel_money', 'halotel', 'azampesa', 'cash'])
  paymentMethod?: string;

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
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}
