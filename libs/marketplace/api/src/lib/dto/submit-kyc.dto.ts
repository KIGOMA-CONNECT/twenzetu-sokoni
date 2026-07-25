import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @IsEnum(['DRIVER', 'RESTAURANT', 'MARKET_CAPTAIN', 'MAMA_FUA'])
  @IsNotEmpty()
  partnerType!: string;

  @IsString()
  @IsNotEmpty()
  nidaPhotoUrl!: string;

  @IsString()
  @IsNotEmpty()
  selfiePhotoUrl!: string;

  @IsOptional()
  @IsString()
  nidaNumber?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  tinNumber?: string;
}
