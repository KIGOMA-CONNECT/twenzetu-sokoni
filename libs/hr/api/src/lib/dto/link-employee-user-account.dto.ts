import { IsUUID } from 'class-validator';

export class LinkEmployeeUserAccountDto {
  @IsUUID('4')
  public userId!: string;
}
