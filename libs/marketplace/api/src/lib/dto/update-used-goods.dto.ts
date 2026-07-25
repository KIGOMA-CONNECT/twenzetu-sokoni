import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUsedGoodsDto {
  @ApiPropertyOptional({ description: 'Asking price' })
  @IsOptional()
  @IsNumber()
  askingPrice?: number;

  @ApiPropertyOptional({ description: 'Listing title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
