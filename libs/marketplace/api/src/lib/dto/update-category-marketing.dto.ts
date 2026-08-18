import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryMarketingDto {
  @ApiPropertyOptional({ description: 'Short marketing tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ description: 'Highlighted benefits' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional({ description: 'Emoji shown with the category' })
  @IsOptional()
  @IsString()
  emoji?: string;
}