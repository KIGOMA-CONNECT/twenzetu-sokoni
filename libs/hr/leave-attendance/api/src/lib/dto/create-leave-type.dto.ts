import { IsBoolean, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsNumber()
  @Min(0)
  @Max(365)
  public defaultDaysPerYear!: number;

  @IsBoolean()
  public requiresApproval!: boolean;
}
