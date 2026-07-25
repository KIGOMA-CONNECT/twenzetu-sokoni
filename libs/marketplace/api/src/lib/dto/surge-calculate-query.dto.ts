import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SurgeCalculateQueryDto {
  @ApiProperty({ description: 'Base fare amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseFare!: number;

  @ApiProperty({ description: 'Distance in kilometers' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanceKm!: number;

  @ApiProperty({ description: 'Rate per kilometer' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  perKmRate!: number;

  @ApiPropertyOptional({ description: 'Trip duration in minutes', default: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Rate per minute', default: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  perMinuteRate?: number;
}
