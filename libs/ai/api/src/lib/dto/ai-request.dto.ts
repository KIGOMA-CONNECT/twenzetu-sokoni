import 'reflect-metadata';
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AiContextDto {
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @IsObject()
  facts!: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  rows?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  constraints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questions?: string[];

  @IsOptional()
  payload?: unknown;
}

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

  @IsOptional()
  @ValidateNested()
  @Type(() => AiContextDto)
  context?: AiContextDto;
}

export class AiStatusDto {
  @IsOptional()
  @IsString()
  module?: string;
}
