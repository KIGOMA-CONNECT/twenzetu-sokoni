import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class DefineFieldDto {
  @IsString()
  entityType!: string;

  @IsString()
  fieldName!: string;

  @IsString()
  fieldType!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isUnique?: boolean;

  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  defaultValue?: unknown;

  @IsOptional()
  @IsArray()
  options?: Array<{ label: string; value: string | number }>;

  @IsOptional()
  @IsArray()
  validation?: Array<{ constraint: string; parameters?: Record<string, unknown> }>;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  group?: string;
}

export class DefineFormDto {
  @IsString()
  entityType!: string;

  @IsString()
  formName!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  layout?: 'GRID' | 'FLOW' | 'TABS' | 'STEPS' | 'SIDEBAR';

  @IsOptional()
  @IsArray()
  sections?: Array<{ title: string; fields: string[]; description?: string; isCollapsible?: boolean; isCollapsed?: boolean }>;

  @IsOptional()
  @IsNumber()
  columns?: number;

  @IsOptional()
  @IsString()
  submitLabel?: string;

  @IsOptional()
  @IsString()
  cancelLabel?: string;
}

export class DefinePermissionDto {
  @IsString()
  entityType!: string;

  @IsString()
  role!: string;

  @IsArray()
  actions!: string[];

  @IsOptional()
  @IsString()
  scope?: 'ALL' | 'OWN' | 'DEPARTMENT' | 'BRANCH' | 'COMPANY';

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  fields?: { readable?: string[]; writable?: string[] };
}

export class GenerateFormDto {
  @IsString()
  entityType!: string;

  @IsString()
  formName!: string;
}
