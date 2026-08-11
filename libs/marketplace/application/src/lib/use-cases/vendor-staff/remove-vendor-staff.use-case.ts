import { Injectable, Inject } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import {
  IVendorMemberRepository,
} from '@afri-market/marketplace-domain';
import {
  VENDOR_MEMBER_REPOSITORY,
} from '../../tokens';

@Injectable()
export class RemoveVendorStaffUseCase {
  constructor(
    @Inject(VENDOR_MEMBER_REPOSITORY) private readonly memberRepo: IVendorMemberRepository,
  ) {}

  public async execute(vendorId: string, memberId: string) {
    const member = await this.memberRepo.findById(EntityId.from(memberId));
    if (!member || member.vendorId.value !== vendorId) {
      throw new Error('Staff member not found');
    }

    member.deactivate();
    await this.memberRepo.save(member);
    return { success: true, id: member.id.value };
  }
}
