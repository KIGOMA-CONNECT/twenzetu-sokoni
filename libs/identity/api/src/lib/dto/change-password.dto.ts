import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from './password-policy';

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentP@ss1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ example: 'newP@ss1' })
  @IsStrongPassword()
  newPassword!: string;
}
