import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubmitServiceQuoteDto {
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
