import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({ description: 'Opaque refresh token to revoke' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
