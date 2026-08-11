import { IsEnum, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VENDOR_STAFF_ROLES } from '@afri-market/marketplace-domain';

export class InviteVendorStaffDto {
  @ApiProperty({ description: 'Staff phone number in international format (e.g. +255712345678)' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phoneNumber must be in E.164 format (e.g. +255712345678)' })
  phoneNumber!: string;

  @ApiProperty({ description: 'Staff full name' })
  @IsString()
  fullName!: string;

  @ApiProperty({ description: 'Staff role', enum: VENDOR_STAFF_ROLES })
  @IsEnum(VENDOR_STAFF_ROLES)
  role!: (typeof VENDOR_STAFF_ROLES)[number];
}
