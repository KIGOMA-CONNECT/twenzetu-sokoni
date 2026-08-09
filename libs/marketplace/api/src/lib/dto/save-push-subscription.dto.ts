import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PushKeysDto {
  @ApiProperty({ description: 'P-256 public key (base64url)' })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ description: 'Auth secret (base64url)' })
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class SavePushSubscriptionDto {
  @ApiProperty({ description: 'Push service endpoint URL' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiPropertyOptional({ description: 'Subscription expiration time (ms)' })
  @IsOptional()
  @IsNumber()
  expirationTime?: number | null;

  @ApiProperty({ type: () => PushKeysDto, description: 'Subscription keys' })
  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}
