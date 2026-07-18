import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;

export class HireCandidateDto {
  @IsString()
  @IsNotEmpty()
  public employeeNumber!: string;

  @IsDateString()
  public hireDate!: string;

  @IsIn(EMPLOYMENT_TYPES)
  public employmentType!: (typeof EMPLOYMENT_TYPES)[number];

  @IsOptional()
  @IsUUID('4')
  public orgUnitId?: string;
}
