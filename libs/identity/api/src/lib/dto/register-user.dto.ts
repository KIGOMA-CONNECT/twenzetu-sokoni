import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@afri-market/identity-domain';

export class RegisterUserDto {
  @ApiPropertyOptional({
    example: 'uuid-of-tenant',
    description: 'Tenant UUID. Omitted for the public marketplace flow — the default tenant is resolved server-side.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tenantId?: string;

  @ApiProperty({ example: '+250788123456' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Phone number must be in E.164 format (e.g. +250788123456)' })
  phoneNumber!: string;

  @ApiProperty({ example: 'Jean Ndayisaba' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ enum: ['customer', 'vendor', 'driver', 'market_captain'] })
  @IsEnum(['customer', 'vendor', 'driver', 'market_captain'] as const)
  role!: Exclude<UserRole, 'admin' | 'super_admin'>;

  @ApiProperty({ example: 'secureP@ss1' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
  })
  password!: string;

  @ApiPropertyOptional({ example: 'jean@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: 'Kigali Market Fresh Ltd', description: 'Business name (required for vendors)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @ApiPropertyOptional({
    example: '120199123456789',
    description: 'National ID (NIN) for drivers or business registration number for vendors',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ninOrRegNo?: string;

  @ApiPropertyOptional({ example: 'Kigali' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
