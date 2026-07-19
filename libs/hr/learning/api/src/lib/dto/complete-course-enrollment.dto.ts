import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CompleteCourseEnrollmentDto {
  @IsDateString()
  public completedDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  public score?: number;
}
