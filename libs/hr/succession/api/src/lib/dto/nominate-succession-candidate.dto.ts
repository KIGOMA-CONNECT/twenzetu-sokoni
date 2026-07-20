import { IsIn, IsOptional, IsString } from 'class-validator';

const READINESS_LEVELS = ['READY_NOW', 'READY_1_2_YEARS', 'READY_3_5_YEARS', 'NOT_READY'] as const;

export class NominateSuccessionCandidateDto {
  @IsIn(READINESS_LEVELS)
  public readinessLevel!: (typeof READINESS_LEVELS)[number];

  @IsOptional()
  @IsString()
  public notes?: string;
}
