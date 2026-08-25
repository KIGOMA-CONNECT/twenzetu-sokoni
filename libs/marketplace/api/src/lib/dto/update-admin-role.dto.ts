import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateAdminRoleDto {
  @ApiProperty({ enum: ['admin', 'super_admin'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['admin', 'super_admin'])
  role!: string;
}
