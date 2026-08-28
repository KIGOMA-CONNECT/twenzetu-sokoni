import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber } from 'class-validator';

export class SetSystemConfigDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  valueType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class SetTenantConfigDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  valueType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class SetFeatureFlagDto {
  @IsString()
  key!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  state!: string;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsArray()
  allowedTenantIds?: string[];

  @IsOptional()
  @IsArray()
  allowedRoles?: string[];
}
