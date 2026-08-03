import { IsOptional, IsString } from 'class-validator';

export class LeaveRequestDecisionDto {
  @IsOptional()
  @IsString()
  public comment?: string;
}
