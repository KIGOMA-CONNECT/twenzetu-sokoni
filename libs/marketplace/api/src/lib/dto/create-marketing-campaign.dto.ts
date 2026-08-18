import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}