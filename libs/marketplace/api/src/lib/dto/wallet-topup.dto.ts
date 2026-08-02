import { IsIn, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const WALLET_TOPUP_PROVIDERS = [
  'mpesa',
  'mixx_by_yas',
  'airtel_money',
  'halotel',
  'card',
  'bank',
] as const;

export type WalletTopupProvider = (typeof WALLET_TOPUP_PROVIDERS)[number];

export class WalletTopupDto {
  @ApiProperty({ description: 'Amount to top-up', minimum: 100 })
  @IsNumber()
  @Min(100)
  amount!: number;

  @ApiProperty({ description: 'Payment phone number (e.g. 0712345678 or +255712345678)' })
  @IsString()
  @Matches(/^(\+?255|0)\d{9}$/, { message: 'Phone must be a valid Tanzanian number (e.g. 0712345678 or +255712345678)' })
  phoneNumber!: string;

  @ApiPropertyOptional({ description: 'Payment provider', default: 'mpesa', enum: WALLET_TOPUP_PROVIDERS })
  @IsOptional()
  @IsIn(WALLET_TOPUP_PROVIDERS)
  provider?: WalletTopupProvider;

  @ApiPropertyOptional({ description: 'Cardholder name (required when provider=card)' })
  @IsOptional()
  @IsString()
  cardHolder?: string;

  @ApiPropertyOptional({ description: 'Card number / virtual card identifier (required when provider=card)' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({ description: 'Card expiry MM/YY (required when provider=card)' })
  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @ApiPropertyOptional({ description: 'Bank account reference (required when provider=bank)' })
  @IsOptional()
  @IsString()
  bankReference?: string;
}
