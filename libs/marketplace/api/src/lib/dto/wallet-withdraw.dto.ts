import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const WALLET_WITHDRAW_PROVIDERS = [
  'mpesa',
  'mixx_by_yas',
  'tigo_money',
  'tigo_pesa',
  'airtel_money',
  'halotel',
  'azampesa',
] as const;

export type WalletWithdrawProvider = (typeof WALLET_WITHDRAW_PROVIDERS)[number];

export class WalletWithdrawDto {
  @ApiProperty({ description: 'Amount to withdraw', minimum: 100 })
  @IsNumber()
  @Min(100)
  amount!: number;

  @ApiProperty({ description: 'Mobile money phone number to receive the funds' })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ description: 'Mobile money provider', enum: [...WALLET_WITHDRAW_PROVIDERS] })
  @IsIn(WALLET_WITHDRAW_PROVIDERS)
  provider!: WalletWithdrawProvider;

  @ApiPropertyOptional({ description: 'Description / note' })
  @IsOptional()
  @IsString()
  description?: string;
}
