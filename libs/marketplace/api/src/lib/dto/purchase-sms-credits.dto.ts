import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class PurchaseSmsCreditsDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Min(1)
  credits!: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount!: number;
}
