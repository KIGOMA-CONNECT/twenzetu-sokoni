import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RegisterAgentDto {
  @IsEnum(['FIELD_CAPTAIN', 'FRANCHISE_PARTNER', 'CITY_MANAGER'])
  @IsNotEmpty()
  agentType!: string;

  @IsString()
  @IsNotEmpty()
  coverageArea!: string;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;
}
