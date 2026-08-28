import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletBankWithdrawDto {
  @ApiProperty({ description: 'Amount to withdraw', minimum: 1000 })
  @IsNumber()
  @Min(1000)
  amount!: number;

  @ApiProperty({ description: 'Bank name' })
  @IsString()
  bankName!: string;

  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  bankAccountNumber!: string;

  @ApiProperty({ description: 'Bank account name' })
  @IsString()
  bankAccountName!: string;

  @ApiPropertyOptional({ description: 'Bank code for automated transfers' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ description: 'Description / note' })
  @IsOptional()
  @IsString()
  description?: string;
}
