import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkVerifyDriversDto {
  @ApiProperty({ description: 'Driver user ids to verify', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  driverIds!: string[];
}

export class BulkSetDriverStatusDto {
  @ApiProperty({ description: 'Driver user ids to update', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  driverIds!: string[];

  @ApiProperty({ description: 'New status for all listed drivers', enum: ['ACTIVE', 'SUSPENDED'] })
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'SUSPENDED';
}

export class BulkAssignDeliveriesDto {
  @ApiProperty({ description: 'Order ids to assign (max 100 per batch)', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  orderIds!: string[];

  @ApiPropertyOptional({ description: 'Restrict assignment to these drivers (default: all available)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  driverIds?: string[];
}
