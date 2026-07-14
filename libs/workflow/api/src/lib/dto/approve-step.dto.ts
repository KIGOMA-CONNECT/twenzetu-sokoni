import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ApproveStepDto {
  @IsInt()
  @Min(1)
  public stepOrder!: number;

  @IsOptional()
  @IsString()
  public comment?: string;
}
