import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

const CATEGORIES = ['COMPLIANCE', 'TECHNICAL', 'LEADERSHIP', 'SOFT_SKILLS', 'OTHER'] as const;

export class CreateCourseDto {
  @IsString()
  @MinLength(1)
  public title!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  public durationHours!: number;

  @IsIn(CATEGORIES)
  public category!: (typeof CATEGORIES)[number];

  @IsOptional()
  @IsString()
  public description?: string;
}
