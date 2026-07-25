import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsedGoodsDto {
  @ApiProperty({ description: 'Listing title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Category' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ description: 'Asking price' })
  @IsNumber()
  @Min(0)
  askingPrice!: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'RWF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Location description' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Item condition', enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'] })
  @IsEnum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'])
  condition!: string;

  @ApiPropertyOptional({ description: 'Photo URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiProperty({ description: 'Seller name' })
  @IsString()
  @IsNotEmpty()
  sellerName!: string;

  @ApiProperty({ description: 'Seller phone' })
  @IsString()
  @IsNotEmpty()
  sellerPhone!: string;
}
