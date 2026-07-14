import { IsOptional, IsUUID } from 'class-validator';

export class TransferEmployeeDto {
  @IsOptional()
  @IsUUID('4')
  public newOrgUnitId?: string;
}
