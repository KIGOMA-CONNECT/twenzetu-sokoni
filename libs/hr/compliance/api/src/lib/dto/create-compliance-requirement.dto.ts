import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const CATEGORIES = ['SAFETY', 'LEGAL', 'CERTIFICATION', 'TRAINING', 'OTHER'] as const;
const RECURRENCES = ['ONE_TIME', 'QUARTERLY', 'ANNUAL', 'BIENNIAL'] as const;

export class CreateComplianceRequirementDto {
  @IsString()
  @MinLength(1)
  public name!: string;

  @IsIn(CATEGORIES)
  public category!: (typeof CATEGORIES)[number];

  @IsIn(RECURRENCES)
  public recurrence!: (typeof RECURRENCES)[number];

  @IsOptional()
  @IsString()
  public description?: string;
}
