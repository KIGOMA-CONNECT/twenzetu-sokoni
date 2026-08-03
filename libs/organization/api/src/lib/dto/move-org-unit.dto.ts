import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MoveOrgUnitDto {
  @IsOptional()
  @IsUUID('4')
  public newParentId?: string;

  @IsInt()
  @Min(1)
  public expectedVersion!: number;
}
