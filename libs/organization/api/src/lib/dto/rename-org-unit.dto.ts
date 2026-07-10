import { IsNotEmpty, IsString } from 'class-validator';

export class RenameOrgUnitDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;
}
