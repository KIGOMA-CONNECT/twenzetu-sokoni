import { IsInt, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class AllocateLeaveBalanceDto {
  @IsUUID('4')
  public leaveTypeId!: string;

  @IsInt()
  @Min(2000)
  @Max(2200)
  public year!: number;

  @IsNumber()
  @Min(0)
  @Max(365)
  public allocatedDays!: number;
}
