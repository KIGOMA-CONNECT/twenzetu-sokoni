import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+250788123456' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Phone number must be in E.164 format' })
  phoneNumber!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Matches(/^\d{4,8}$/, { message: 'OTP code must be 4-8 digits' })
  code!: string;
}
