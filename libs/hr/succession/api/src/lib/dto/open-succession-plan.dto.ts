import { IsOptional, IsString } from 'class-validator';

export class OpenSuccessionPlanDto {
  @IsOptional()
  @IsString()
  public notes?: string;
}
