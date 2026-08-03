import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class SubmitLeaveRequestDto {
  @IsUUID('4')
  public leaveTypeId!: string;

  @IsDateString()
  public startDate!: string;

  @IsDateString()
  public endDate!: string;

  @IsNumber()
  @Min(0.5)
  @Max(365)
  public numberOfDays!: number;

  @IsOptional()
  @IsString()
  public reason?: string;
}
