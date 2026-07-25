import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RepayLoanDto {
  @ApiProperty({ description: 'Repayment amount' })
  @IsNumber()
  @Min(1)
  amount!: number;
}
