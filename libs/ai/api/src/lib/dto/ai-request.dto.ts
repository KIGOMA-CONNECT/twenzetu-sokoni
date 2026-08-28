import 'reflect-metadata';
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

function sanitizeString(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  // Strip angle brackets and control chars to block XSS/prompt injection via HTML/script
  return value.replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export class AiContextDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeString(value))
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
  @Matches(/^[a-z0-9-]{2,50}$/, { message: 'module must be 2-50 chars, lowercase alphanumeric and hyphens' })
  @Transform(({ value }) => sanitizeString(value))
  module!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeString(value))
  message!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeString(value))
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

export class AiFeedbackDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(up|down)$/, { message: 'feedback must be up or down' })
  feedback!: string;
}
