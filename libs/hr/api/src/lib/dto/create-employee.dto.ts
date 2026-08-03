import { IsDateString, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;
const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  public employeeNumber!: string;

  @IsString()
  @IsNotEmpty()
  public firstName!: string;

  @IsString()
  @IsNotEmpty()
  public lastName!: string;

  @IsEmail()
  public email!: string;

  @IsDateString()
  public hireDate!: string;

  @IsIn(EMPLOYMENT_TYPES)
  public employmentType!: (typeof EMPLOYMENT_TYPES)[number];

  @IsOptional()
  @IsString()
  public phone?: string;

  @IsOptional()
  @IsDateString()
  public dateOfBirth?: string;

  @IsOptional()
  @IsIn(GENDERS)
  public gender?: (typeof GENDERS)[number];

  @IsOptional()
  @IsUUID('4')
  public positionId?: string;

  @IsOptional()
  @IsUUID('4')
  public orgUnitId?: string;

  @IsOptional()
  @IsUUID('4')
  public userId?: string;
}
