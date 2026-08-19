import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeactivateAccountDto {
  @ApiProperty({ example: 'currentP@ss1' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;
}