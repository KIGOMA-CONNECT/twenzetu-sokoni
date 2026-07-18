import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class RegisterCandidateDto {
  @IsString()
  @IsNotEmpty()
  public firstName!: string;

  @IsString()
  @IsNotEmpty()
  public lastName!: string;

  @IsEmail()
  public email!: string;

  @IsOptional()
  @IsString()
  public phone?: string;

  @IsOptional()
  @IsUrl()
  public resumeUrl?: string;

  @IsOptional()
  @IsString()
  public source?: string;
}
