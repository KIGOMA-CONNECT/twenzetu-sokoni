import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProcurementDto {
  @IsString()
  @IsNotEmpty()
  productQuery!: string;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;
}
