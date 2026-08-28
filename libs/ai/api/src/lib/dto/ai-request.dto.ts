import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AiChatDto {
  @IsString()
  @IsNotEmpty()
  module!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  feature?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'system' | 'user' | 'assistant'; content: string }[];
}

export class AiStatusDto {
  @IsOptional()
  @IsString()
  module?: string;
}
