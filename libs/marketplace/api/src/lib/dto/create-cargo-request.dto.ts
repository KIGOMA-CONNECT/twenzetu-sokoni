import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CargoLocationDto {
  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

export class CreateCargoRequestDto {
  @IsString()
  @IsNotEmpty()
  subServiceName!: string;

  @IsString()
  @IsNotEmpty()
  vehicleName!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CargoLocationDto)
  pickup!: CargoLocationDto;

  @IsObject()
  @ValidateNested()
  @Type(() => CargoLocationDto)
  delivery!: CargoLocationDto;

  @IsNumber()
  @Min(0)
  weightKg!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  fare?: number;
}
