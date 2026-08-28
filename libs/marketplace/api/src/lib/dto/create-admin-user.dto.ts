import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsIn, IsArray, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ example: '+255754100001' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{10,15}$/)
  phoneNumber!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: ['admin', 'super_admin'] })
  @IsString()
  @IsIn(['admin', 'super_admin'])
  role!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}
