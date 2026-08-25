import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, MaxLength, Matches } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ example: '+255754100001' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{10,15}$/)
  recipientPhone!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1600)
  message!: string;

  @ApiPropertyOptional({ enum: ['customer', 'supplier'] })
  @IsOptional()
  @IsString()
  @IsIn(['customer', 'supplier'])
  recipientType?: string;
}
