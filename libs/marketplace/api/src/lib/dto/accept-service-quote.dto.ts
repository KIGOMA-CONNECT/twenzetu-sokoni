import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AcceptServiceQuoteDto {
  @IsString()
  @IsNotEmpty()
  quoteId!: string;

  @IsEnum(['mpesa', 'tigo_money', 'airtel_money', 'cash'])
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
