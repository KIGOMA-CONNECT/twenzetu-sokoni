import { IsDateString, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

export class UpdateEmployeePersonalDetailsDto {
  @IsOptional()
  @IsString()
  public firstName?: string;

  @IsOptional()
  @IsString()
  public lastName?: string;

  @IsOptional()
  @IsEmail()
  public email?: string;

  @IsOptional()
  @IsString()
  public phone?: string;

  @IsOptional()
  @IsDateString()
  public dateOfBirth?: string;

  @IsOptional()
  @IsIn(GENDERS)
  public gender?: (typeof GENDERS)[number];
}
