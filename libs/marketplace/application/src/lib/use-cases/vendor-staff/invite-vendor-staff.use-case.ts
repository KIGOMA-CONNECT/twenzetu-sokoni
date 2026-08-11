import { Injectable, Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EntityId, TenantId, PhoneNumber } from '@afri-market/kernel';
import { User, IUserRepository } from '@afri-market/identity-domain';
import { normalizeE164 } from '@afri-market/integrations';
import {
  VendorMember,
  VendorStaffRole,
  IVendorMemberRepository,
} from '@afri-market/marketplace-domain';
import {
  VENDOR_MEMBER_REPOSITORY,
  USER_REPOSITORY,
} from '../../tokens';
import { IPasswordHasher } from '@afri-market/identity-infrastructure';

export interface InviteVendorStaffInput {
  readonly tenantId: string;
  readonly vendorId: string;
  readonly phoneNumber: string;
  readonly fullName: string;
  readonly role: VendorStaffRole;
}

@Injectable()
export class InviteVendorStaffUseCase {
  constructor(
    @Inject(VENDOR_MEMBER_REPOSITORY) private readonly memberRepo: IVendorMemberRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject('IPasswordHasher') private readonly hasher: IPasswordHasher,
  ) {}

  public async execute(input: InviteVendorStaffInput) {
    const canonicalPhone = this.canonicalize(input.phoneNumber);
    let user = await this.userRepo.findByPhoneNumber(canonicalPhone);
    if (!user) {
      user = await this.createUser(input.tenantId, canonicalPhone, input.fullName);
    }

    const existing = await this.memberRepo.findOneByVendorAndUser(input.vendorId, user.id.value);
    if (existing) {
      throw new Error('This person is already part of your vendor');
    }

    const member = VendorMember.create({
      tenantId: TenantId.create(input.tenantId),
      vendorId: EntityId.from(input.vendorId),
      userId: user.id,
      role: input.role,
    });
    await this.memberRepo.save(member);

    return {
      ...member.toDto(),
      fullName: user.fullName,
      phoneNumber: user.phoneNumber.value,
    };
  }

  private async createUser(tenantId: string, phone: string, fullName: string): Promise<User> {
    const passwordHash = await this.hasher.hash(randomBytes(32).toString('hex'));
    const user = User.create({
      tenantId: TenantId.create(tenantId),
      phoneNumber: PhoneNumber.create(phone),
      fullName,
      role: 'customer',
      passwordHash,
    });
    user.verify();
    await this.userRepo.save(user);
    return user;
  }

  private canonicalize(phone: string): string {
    try {
      return normalizeE164(phone).e164;
    } catch {
      return phone.trim();
    }
  }
}
