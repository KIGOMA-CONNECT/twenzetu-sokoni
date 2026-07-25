import { IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class RequestLoanDto {
  @IsEnum(['STOCK_FLOAT', 'FUEL_LOAN', 'REPAIR_LOAN', 'WORKING_CAPITAL'])
  @IsNotEmpty()
  loanType!: string;

  @IsNumber()
  @Min(1)
  requestedAmount!: number;
}
