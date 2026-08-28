import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const WALLET_TRANSFER_RECIPIENT_TYPES = ['phone', 'email', 'user_id'] as const;

export type WalletTransferRecipientType = (typeof WALLET_TRANSFER_RECIPIENT_TYPES)[number];

export class WalletTransferDto {
  @ApiProperty({ description: 'Amount to transfer', minimum: 100 })
  @IsNumber()
  @Min(100)
  amount!: number;

  @ApiProperty({ description: 'Recipient identifier (phone number, email, or user ID)' })
  @IsString()
  recipientIdentifier!: string;

  @ApiProperty({ description: 'Type of recipient identifier', enum: [...WALLET_TRANSFER_RECIPIENT_TYPES] })
  @IsIn(WALLET_TRANSFER_RECIPIENT_TYPES)
  recipientType!: WalletTransferRecipientType;

  @ApiPropertyOptional({ description: 'Description / note for the transfer' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'PIN for 2FA (reserved for future use)' })
  @IsOptional()
  @IsString()
  pin?: string;
}
