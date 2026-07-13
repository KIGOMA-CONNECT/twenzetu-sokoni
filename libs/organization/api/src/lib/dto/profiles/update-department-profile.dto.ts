import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateDepartmentProfileDto {
  @IsOptional()
  @IsUUID('4')
  public costCenterOrgUnitId?: string;

  @IsOptional()
  @IsString()
  public managerReference?: string;

  @IsInt()
  @Min(1)
  public expectedVersion!: number;
}
