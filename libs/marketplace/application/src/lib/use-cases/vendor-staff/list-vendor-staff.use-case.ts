import { Injectable, Inject } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import {
  IVendorMemberRepository,
  IVendorRepository,
} from '@afri-market/marketplace-domain';
import { IUserRepository } from '@afri-market/identity-domain';
import {
  VENDOR_REPOSITORY,
  VENDOR_MEMBER_REPOSITORY,
  USER_REPOSITORY,
} from '../../tokens';

@Injectable()
export class ListVendorStaffUseCase {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(VENDOR_MEMBER_REPOSITORY) private readonly memberRepo: IVendorMemberRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  public async execute(vendorId: string) {
    const vendor = await this.vendorRepo.findById(EntityId.from(vendorId));
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const members = await this.memberRepo.findByVendorId(vendorId, 'ACTIVE');
    const staff = [];
    for (const member of members) {
      const user = await this.userRepo.findById(member.userId);
      staff.push({
        ...member.toDto(),
        fullName: user?.fullName ?? null,
        phoneNumber: user?.phoneNumber.value ?? null,
      });
    }

    return {
      vendorId: vendor.id.value,
      shopName: vendor.shopName,
      staff,
    };
  }
}
