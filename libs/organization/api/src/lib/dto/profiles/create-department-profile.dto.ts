import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDepartmentProfileDto {
  @IsOptional()
  @IsUUID('4')
  public costCenterOrgUnitId?: string;

  @IsOptional()
  @IsString()
  public managerReference?: string;
}
