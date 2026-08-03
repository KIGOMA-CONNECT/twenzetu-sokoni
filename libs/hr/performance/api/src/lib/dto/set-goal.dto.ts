import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class SetGoalDto {
  @IsString()
  @MinLength(1)
  public title!: string;

  @IsDateString()
  public targetDate!: string;

  @IsOptional()
  @IsString()
  public description?: string;
}
