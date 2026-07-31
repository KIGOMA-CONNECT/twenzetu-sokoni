import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @IsEnum(['DRIVER', 'RESTAURANT', 'MARKET_CAPTAIN', 'MAMA_FUA'])
  @IsNotEmpty()
  partnerType!: string;

  @IsOptional()
  @IsString()
  nidaPhotoUrl?: string;

  @IsOptional()
  @IsString()
  selfiePhotoUrl?: string;

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
