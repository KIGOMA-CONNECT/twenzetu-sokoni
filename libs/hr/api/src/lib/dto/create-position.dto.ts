import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsString()
  @IsNotEmpty()
  public title!: string;

  @IsOptional()
  @IsString()
  public description?: string;
}
