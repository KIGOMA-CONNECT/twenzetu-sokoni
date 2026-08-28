import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SUPPLIER_PAYMENT_METHODS = ['mpesa', 'mixx_by_yas', 'tigo_money', 'tigo_pesa', 'airtel_money', 'halotel', 'azampesa', 'bank'] as const;

export type SupplierPaymentMethod = (typeof SUPPLIER_PAYMENT_METHODS)[number];

export class PaySupplierDto {
  @ApiProperty({ description: 'Amount to pay', minimum: 100 })
  @IsNumber()
  @Min(100)
  amount!: number;

  @ApiProperty({ description: 'Supplier phone number for mobile money payment' })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ description: 'Payment method', enum: [...SUPPLIER_PAYMENT_METHODS] })
  @IsIn(SUPPLIER_PAYMENT_METHODS)
  method!: SupplierPaymentMethod;

  @ApiPropertyOptional({ description: 'Description / note for the payment' })
  @IsOptional()
  @IsString()
  description?: string;
}
