import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ResolveDisputeDto {
  @IsEnum(['FULL_REFUND', 'PARTIAL_REFUND', 'RE_DELIVERY', 'RE_WASH', 'REJECTED'])
  @IsNotEmpty()
  resolutionType!: string;

  @IsNumber()
  @Min(0)
  resolvedAmount!: number;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
