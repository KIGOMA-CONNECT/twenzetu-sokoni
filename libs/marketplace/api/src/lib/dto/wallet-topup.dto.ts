import { IsNumber, IsString, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WalletTopupDto {
  @ApiProperty({ description: 'Amount to top-up', minimum: 100 })
  @IsNumber()
  @Min(100)
  amount!: number;

  @ApiProperty({ description: 'M-Pesa phone number (e.g. 0712345678 or +255712345678)' })
  @IsString()
  @Matches(/^(\+?255|0)\d{9}$/, { message: 'Phone must be a valid Tanzanian number (e.g. 0712345678 or +255712345678)' })
  phoneNumber!: string;
}
