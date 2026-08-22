import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMarketingCampaignSegmentDto {
  @ApiPropertyOptional({ description: 'Only customers with at least this many delivered orders' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minOrders?: number;

  @ApiPropertyOptional({ description: 'Only customers who placed an order within this many days' })
  @IsOptional()
  @IsInt()
  @Min(1)
  lastOrderWithinDays?: number;
}

export class CreateMarketingCampaignVariantDto {
  @ApiPropertyOptional({ description: 'Human-readable variant label (defaults to Variant A/B/C...)' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @ApiProperty({ description: 'SMS message body for this variant' })
  @IsString()
  message!: string;
}

export class CreateMarketingCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ description: 'SMS message body sent to each customer' })
  @IsString()
  message!: string;

  @ApiProperty({ description: 'Delivery channel (sms only for now)', default: 'sms' })
  @IsIn(['sms', 'whatsapp'])
  channel!: 'sms' | 'whatsapp';

  @ApiPropertyOptional({ description: 'Schedule for later (ISO 8601); empty means immediate launch after save' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Audience segmentation criteria (default: all active customers)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMarketingCampaignSegmentDto)
  segment?: CreateMarketingCampaignSegmentDto;

  @ApiPropertyOptional({ description: 'Enable A/B testing across message variants', default: false })
  @IsOptional()
  @IsBoolean()
  testEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Message variants for A/B testing (2-4 when testEnabled)', type: [CreateMarketingCampaignVariantDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CreateMarketingCampaignVariantDto)
  variants?: CreateMarketingCampaignVariantDto[];
}