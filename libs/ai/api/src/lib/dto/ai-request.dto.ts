import 'reflect-metadata';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

function sanitizeString(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  // Strip angle brackets and control chars to block XSS/prompt injection via HTML/script
  // eslint-disable-next-line no-control-regex -- intentional control-char strip for XSS
  return value.replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export class AiContextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeString(value))
  summary!: string;

  @IsObject()
  facts!: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  rows?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  constraints?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  questions?: string[];

  @IsOptional()
  payload?: unknown;
}

export class AiChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]{2,50}$/, { message: 'module must be 2-50 chars, lowercase alphanumeric and hyphens' })
  @Transform(({ value }) => sanitizeString(value))
  module!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(({ value }) => sanitizeString(value))
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => sanitizeString(value))
  feature?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
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
