import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@afri-market/identity-domain';

export class RegisterUserDto {
  @ApiProperty({ example: 'uuid-of-tenant' })
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ example: '+250788123456' })
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @ApiProperty({ example: 'Jean Ndayisaba' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ enum: ['customer', 'vendor', 'driver', 'market_captain'] })
  @IsEnum(['customer', 'vendor', 'driver', 'market_captain'] as const)
  role!: Exclude<UserRole, 'admin' | 'super_admin'>;

  @ApiProperty({ example: 'secureP@ss1' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
  })
  password!: string;

  @ApiPropertyOptional({ example: 'jean@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}
