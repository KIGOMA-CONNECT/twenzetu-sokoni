import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  shopName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  /**
   * Platform-controlled; vendor does not set this. If omitted, the server
   * applies the category default from PLATFORM_COMMISSION_BY_CATEGORY.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
