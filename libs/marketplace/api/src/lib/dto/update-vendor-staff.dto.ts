import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VENDOR_STAFF_ROLES } from '@afri-market/marketplace-domain';

export class UpdateVendorStaffDto {
  @ApiProperty({ description: 'New staff role', enum: VENDOR_STAFF_ROLES })
  @IsEnum(VENDOR_STAFF_ROLES)
  role!: (typeof VENDOR_STAFF_ROLES)[number];
}
