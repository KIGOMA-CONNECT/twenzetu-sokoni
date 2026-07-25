import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePoiDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  localName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['LANDMARK', 'BUSINESS', 'MARKET', 'COMMUNITY_POINT', 'DELIVERY_POINT'])
  type!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  landmarkDescription?: string;
}
