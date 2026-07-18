import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitPerformanceReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  public rating!: number;

  @IsOptional()
  @IsString()
  public comments?: string;
}
