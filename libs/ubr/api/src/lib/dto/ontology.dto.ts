import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';

export enum EntityCategoryDto {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  ASSET = 'ASSET',
  DOCUMENT = 'DOCUMENT',
  TRANSACTION = 'TRANSACTION',
  LOCATION = 'LOCATION',
  FINANCIAL = 'FINANCIAL',
  CUSTOM = 'CUSTOM',
}

export class RegisterEntityDto {
  @IsString()
  entityType!: string;

  @IsEnum(EntityCategoryDto)
  entityCategory!: EntityCategoryDto;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  parentEntityId?: string;
}

export class UpdateEntityDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  state?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export class DefineRelationshipDto {
  @IsString()
  sourceEntityType!: string;

  @IsString()
  targetEntityType!: string;

  @IsString()
  relationshipType!: 'IS_A' | 'HAS' | 'USES' | 'OWNS' | 'MANAGES' | 'BELONGS_TO' | 'DEPENDS_ON' | 'TRIGGERS' | 'CUSTOM';

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cardinality?: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;
}

export class SearchEntityDto {
  @IsString()
  query!: string;
}
