import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOrgUnitTypeDto {
  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsOptional()
  @IsString()
  public description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  public allowedParentTypeIds!: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  public sortOrder?: number;
}
