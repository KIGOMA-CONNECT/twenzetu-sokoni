import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceListingDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsEnum(['per_sqm', 'per_hour', 'per_room', 'per_unit'])
  pricingModel!: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  unitLabel?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
