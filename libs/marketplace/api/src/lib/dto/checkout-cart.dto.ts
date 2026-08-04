import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { HEX_UUID_REGEX } from '../common/uuid.util';

export class CheckoutCartDto {
  @IsString()
  @IsNotEmpty()
  @Matches(HEX_UUID_REGEX)
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
