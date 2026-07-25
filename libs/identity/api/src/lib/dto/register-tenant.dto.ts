import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Kigali Fresh Market' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
