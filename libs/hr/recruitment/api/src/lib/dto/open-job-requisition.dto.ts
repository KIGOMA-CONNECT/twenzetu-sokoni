import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

export class OpenJobRequisitionDto {
  @IsUUID('4')
  public positionId!: string;

  @IsString()
  @IsNotEmpty()
  public title!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  public headcount!: number;
}
