import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CargoTripType, CargoVehicleKey } from '@afri-market/marketplace-domain';

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

  @IsEnum(['boda', 'bajaji', 'carry', 'van', 'guta', 'fuso'])
  vehicle!: CargoVehicleKey;

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
  @IsEnum(['instant', 'scheduled'])
  tripType?: CargoTripType;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  insured?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cargoValue?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CargoFareQueryDto {
  @IsNumber()
  @Type(() => Number)
  pickupLat!: number;

  @IsNumber()
  @Type(() => Number)
  pickupLng!: number;

  @IsNumber()
  @Type(() => Number)
  dropLat!: number;

  @IsNumber()
  @Type(() => Number)
  dropLng!: number;

  @IsEnum(['boda', 'bajaji', 'carry', 'van', 'guta', 'fuso'])
  vehicle!: CargoVehicleKey;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  weightKg!: number;

  @IsOptional()
  @IsEnum(['instant', 'scheduled'])
  tripType?: CargoTripType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cargoValue?: number;

  @IsOptional()
  @IsString()
  insured?: string;
}
