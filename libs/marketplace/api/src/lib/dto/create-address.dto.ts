import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ description: 'Address label (e.g. Home, Work)' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ description: 'Full address string' })
  @IsString()
  @IsNotEmpty()
  fullAddress!: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ description: 'Set as default address', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
