import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class PushKeysDto {
  @ApiPropertyOptional({ description: 'P-256 public key (base64url)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  p256dh?: string;

  @ApiPropertyOptional({ description: 'Auth secret (base64url)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  auth?: string;
}

export class SavePushSubscriptionDto {
  @ApiPropertyOptional({ description: 'Push service endpoint URL (web push)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Subscription expiration time (ms)' })
  @IsOptional()
  @IsNumber()
  expirationTime?: number | null;

  @ApiPropertyOptional({ type: () => PushKeysDto, description: 'Subscription keys (web push)' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys?: PushKeysDto;

  @ApiPropertyOptional({ description: 'Firebase Cloud Messaging registration token (native)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fcmToken?: string;
}