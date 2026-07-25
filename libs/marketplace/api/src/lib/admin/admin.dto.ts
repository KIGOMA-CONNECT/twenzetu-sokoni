import { IsEnum, IsInt, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ResolveDisputeAdminDto {
  @ApiProperty({ enum: ['FULL_REFUND', 'PARTIAL_REFUND', 'RE_DELIVERY', 'REJECTED'] })
  @IsEnum(['FULL_REFUND', 'PARTIAL_REFUND', 'RE_DELIVERY', 'REJECTED'])
  resolutionType!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  resolvedAmount!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ default: '7d' })
  @IsString()
  @IsOptional()
  period?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;
}

export class VerifyKycAdminDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class ListDisputesQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number;
}

export class ListPendingVendorsQueryDto {
  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number;
}

export class ListRecentOrdersQueryDto {
  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}
