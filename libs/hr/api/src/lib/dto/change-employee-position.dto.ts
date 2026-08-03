import { IsOptional, IsUUID } from 'class-validator';

export class ChangeEmployeePositionDto {
  @IsOptional()
  @IsUUID('4')
  public newPositionId?: string;
}
