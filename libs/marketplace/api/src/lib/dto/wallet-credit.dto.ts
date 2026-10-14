import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletCreditDto {
  @ApiProperty({ description: 'Wallet owner to credit (user or vendor ID)' })
  @IsString()
  ownerId!: string;

  @ApiProperty({ description: 'Amount to credit', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'Unique reference used for idempotency and audit' })
  @IsString()
  referenceId!: string;

  @ApiPropertyOptional({ description: 'Reference type', example: 'manual_credit' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
