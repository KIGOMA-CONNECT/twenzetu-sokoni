import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenPosShiftDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  openingFloat?: number;
}

export class ClosePosShiftDto {
  @IsNumber()
  @Min(0)
  closingCash!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
