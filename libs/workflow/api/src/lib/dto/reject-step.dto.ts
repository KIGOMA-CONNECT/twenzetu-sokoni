import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RejectStepDto {
  @IsInt()
  @Min(1)
  public stepOrder!: number;

  @IsOptional()
  @IsString()
  public comment?: string;
}
