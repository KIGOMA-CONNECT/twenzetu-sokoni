import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVehicleLocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  longitude!: number;
}
