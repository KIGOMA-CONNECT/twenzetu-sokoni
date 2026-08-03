import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOrgUnitDto {
  @IsUUID('4')
  public orgUnitTypeId!: string;

  @IsOptional()
  @IsUUID('4')
  public parentId?: string;

  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  public sortOrder?: number;
}
